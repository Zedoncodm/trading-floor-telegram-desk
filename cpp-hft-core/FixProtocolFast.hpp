#pragma once

#include <cstdint>
#include <string_view>
#include <array>

#pragma pack(push, 1)

/**
 * @brief Tag-Value ultra-compact en mémoire contiguë FIX 4.4 sans allocation dynamique
 */
struct FixField {
    uint32_t tag;
    char value[32];
};

/**
 * @brief Message FIX 4.4 zéro-allocation structuré pour pipeline HFT
 */
struct FixMessageFast {
    char msg_type[4];      // ex: "D" (NewOrderSingle), "8" (ExecutionReport)
    char cl_ord_id[32];    // Client Order ID
    char symbol[16];       // Symbole (ex: "EURUSD", "BTCUSDT")
    char side;             // '1' = Buy, '2' = Sell
    double price;          // Prix limite
    double order_qty;      // Quantité en lots / notionnel
    uint64_t sending_time; // Timestamp nanosecondes UNIX
    uint16_t field_count;
    std::array<FixField, 8> custom_fields;

    /**
     * @brief Encode le message en payload FIX 4.4 textuel standard (SOH = \x01)
     */
    size_t serializeToBuffer(char* dest, size_t max_len) const noexcept {
        if (!dest || max_len < 128) return 0;
        
        // Entête FIX 4.4 standard minimal
        int written = snprintf(dest, max_len,
            "8=FIX.4.4\x01" "9=%03d\x01" "35=%s\x01" "11=%s\x01" "55=%s\x01" "54=%c\x01" "38=%.4f\x01" "44=%.5f\x01" "60=%llu\x01",
            85, msg_type, cl_ord_id, symbol, side, order_qty, price, (unsigned long long)sending_time
        );

        if (written <= 0) return 0;

        // Calcul et ajout du checksum FIX 10=XXX
        unsigned int sum = 0;
        for (int i = 0; i < written; ++i) {
            sum += static_cast<unsigned char>(dest[i]);
        }
        const unsigned int checksum = sum % 256;

        int chk_written = snprintf(dest + written, max_len - written, "10=%03u\x01", checksum);
        return written + chk_written;
    }
};

/**
 * @brief Segment de Mémoire Partagée (Shared Memory IPC) avec MetaTrader 5 (MT5)
 * Conçu pour CreateFileMappingW / OpenFileMappingW sous Windows avec synchronisation atomique.
 */
struct MT5SharedMemorySegment {
    uint32_t magic_header;       // 0x54464C52 ("TFLR")
    uint32_t protocol_version;    // Version 2026
    std::atomic<uint64_t> seq;    // Sequence counter pour spinlock sans verrouillage lourd

    // KPIs et télémétrie MT5
    double balance;
    double equity;
    double margin;
    double free_margin;
    double session_profit;
    uint32_t open_positions_count;

    // Dernier tick transmis par MT5
    char last_symbol[16];
    double last_bid;
    double last_ask;
    uint64_t tick_timestamp_ns;

    // Ordre d'action rapide injecté par le moteur HFT C++
    struct {
        std::atomic<uint32_t> command_id; // 1 = OPEN, 2 = CLOSE, 3 = CLOSE_ALL, 4 = EMERGENCY_HALT
        char target_symbol[16];
        int32_t cmd_side;                 // 0 = BUY, 1 = SELL
        double lots;
        double stop_loss;
        double take_profit;
        std::atomic<bool> executed;
    } pending_command;
};

#pragma pack(pop)
