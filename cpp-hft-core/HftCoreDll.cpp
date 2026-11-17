#include "SPSCRingBuffer.hpp"
#include "QuantModels.hpp"
#include "FixProtocolFast.hpp"

#include <windows.h>
#include <cstdio>
#include <cstring>
#include <chrono>

#define EXPORT_C extern "C" __declspec(dllexport)

// Instances globales du moteur HFT C++
namespace {
    constexpr size_t RING_CAPACITY = 65536; // 64K slots
    SPSCRingBuffer<FixMessageFast, RING_CAPACITY> g_inbound_queue;
    SPSCRingBuffer<FixMessageFast, RING_CAPACITY> g_outbound_queue;

    AvellanedaStoikovPricer g_as_pricer(0.25, 0.015, 1.5, 1.0);
    MicrostructureAnalyzer g_micro_analyzer;

    HANDLE g_shm_handle = nullptr;
    MT5SharedMemorySegment* g_shm_ptr = nullptr;
    constexpr const wchar_t* SHM_NAME = L"Local\\TradingFloor_MT5_SHM_2026";
}

/**
 * @brief Assigne le thread actuel à un cœur CPU dédié (Thread Pinning / Core Affinity)
 * Élimine le context switching et le saut d'affinité cache L1/L2.
 */
EXPORT_C BOOL __stdcall HFT_PinThreadToCore(DWORD core_index) {
    HANDLE thread = GetCurrentThread();
    DWORD_PTR mask = static_cast<DWORD_PTR>(1) << core_index;
    DWORD_PTR result = SetThreadAffinityMask(thread, mask);
    return result != 0 ? TRUE : FALSE;
}

/**
 * @brief Initialise le mapping de mémoire partagée Windows pour l'interfaçage avec MT5
 */
EXPORT_C BOOL __stdcall HFT_InitSharedMemory() {
    if (g_shm_ptr) return TRUE;

    g_shm_handle = CreateFileMappingW(
        INVALID_HANDLE_VALUE,
        nullptr,
        PAGE_READWRITE,
        0,
        sizeof(MT5SharedMemorySegment),
        SHM_NAME
    );

    if (!g_shm_handle) return FALSE;

    g_shm_ptr = static_cast<MT5SharedMemorySegment*>(
        MapViewOfFile(g_shm_handle, FILE_MAP_ALL_ACCESS, 0, 0, sizeof(MT5SharedMemorySegment))
    );

    if (!g_shm_ptr) {
        CloseHandle(g_shm_handle);
        g_shm_handle = nullptr;
        return FALSE;
    }

    // Initialisation de l'en-tête
    g_shm_ptr->magic_header = 0x54464C52;
    g_shm_ptr->protocol_version = 2026;
    g_shm_ptr->seq.store(1, std::memory_order_relaxed);
    return TRUE;
}

/**
 * @brief Ferme le segment de mémoire partagée
 */
EXPORT_C void __stdcall HFT_CloseSharedMemory() {
    if (g_shm_ptr) {
        UnmapViewOfFile(g_shm_ptr);
        g_shm_ptr = nullptr;
    }
    if (g_shm_handle) {
        CloseHandle(g_shm_handle);
        g_shm_handle = nullptr;
    }
}

/**
 * @brief Calcul du prix de réserve Avellaneda-Stoikov
 */
EXPORT_C double __stdcall HFT_CalculateReservationPrice(double mid_price, double inventory, double time_remaining) {
    return g_as_pricer.computeReservationPrice(mid_price, inventory, time_remaining);
}

/**
 * @brief Calcul du spread optimal et cotation [Bid, Ask]
 */
EXPORT_C void __stdcall HFT_CalculateOptimalQuotes(double mid_price, double inventory, double time_remaining, double* out_bid, double* out_ask) {
    if (!out_bid || !out_ask) return;
    g_as_pricer.computeQuotes(mid_price, inventory, time_remaining, *out_bid, *out_ask);
}

/**
 * @brief Mise à jour de l'Order Flow Imbalance L2 et retour du Z-Score
 */
EXPORT_C double __stdcall HFT_UpdateOrderFlowImbalance(double best_bid, double bid_qty, double best_ask, double ask_qty, double* out_z_score) {
    const double ofi = g_micro_analyzer.updateOrderFlowImbalance(best_bid, bid_qty, best_ask, ask_qty);
    if (out_z_score) {
        *out_z_score = g_micro_analyzer.getOfiZScore(ofi);
    }
    return ofi;
}

/**
 * @brief Injection ultra-rapide d'un ordre dans la mémoire partagée MT5 (moins de 1 microseconde)
 */
EXPORT_C BOOL __stdcall HFT_DispatchEmergencyAction(uint32_t command_id, const char* symbol, int32_t side, double lots) {
    if (!g_shm_ptr) return FALSE;

    g_shm_ptr->pending_command.command_id.store(command_id, std::memory_order_relaxed);
    if (symbol) {
        strncpy_s(g_shm_ptr->pending_command.target_symbol, symbol, sizeof(g_shm_ptr->pending_command.target_symbol) - 1);
    }
    g_shm_ptr->pending_command.cmd_side = side;
    g_shm_ptr->pending_command.lots = lots;
    g_shm_ptr->pending_command.executed.store(false, std::memory_order_release);
    g_shm_ptr->seq.fetch_add(1, std::memory_order_acq_rel);

    return TRUE;
}

BOOL WINAPI DllMain(HINSTANCE hinstDLL, DWORD fdwReason, LPVOID lpvReserved) {
    switch (fdwReason) {
    case DLL_PROCESS_ATTACH:
        DisableThreadLibraryCalls(hinstDLL);
        break;
    case DLL_PROCESS_DETACH:
        HFT_CloseSharedMemory();
        break;
    }
    return TRUE;
}
