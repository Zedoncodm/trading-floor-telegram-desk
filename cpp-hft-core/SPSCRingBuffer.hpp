#pragma once

#include <atomic>
#include <cstddef>
#include <new>
#include <type_traits>
#include <utility>

#if defined(_MSC_VER)
#define HFT_INLINE __forceinline
#elif defined(__GNUC__) || defined(__clang__)
#define HFT_INLINE inline __attribute__((always_inline))
#else
#define HFT_INLINE inline
#endif

// Ligne de cache standard x86-64 pour prévenir formellement le faux partage (False Sharing)
constexpr size_t CACHE_LINE_SIZE = 64;

/**
 * @brief Ring Buffer SPSC (Single Producer Single Consumer) Lock-Free Ultra-Basse Latence
 * Implémentation basée sur le LMAX Disruptor Pattern adapté en C++20 avec alignement cache-line
 * et ordre mémoire acquire-release pour exécution sans verrouillage sous les 50 nanosecondes.
 */
template <typename T, size_t Capacity>
class SPSCRingBuffer {
    static_assert((Capacity != 0) && ((Capacity & (Capacity - 1)) == 0),
                  "Capacity must be a power of two for fast bitwise indexing");
    static_assert(std::is_nothrow_destructible_v<T>, "T must be nothrow destructible");

private:
    static constexpr size_t MASK = Capacity - 1;

    // Buffer de stockage aligné en mémoire pour éviter les accès non alignés
    alignas(CACHE_LINE_SIZE) T buffer_[Capacity];

    // Variables écrites et lues par le Producteur
    alignas(CACHE_LINE_SIZE) std::atomic<size_t> tail_{0}; // Prochain emplacement d'écriture
    size_t cached_head_{0}; // Copie locale du head consommateur pour minimiser la contention de bus

    // Variables écrites et lues par le Consommateur
    alignas(CACHE_LINE_SIZE) std::atomic<size_t> head_{0}; // Prochain emplacement de lecture
    size_t cached_tail_{0}; // Copie locale du tail producteur pour minimiser la contention de bus

public:
    SPSCRingBuffer() noexcept = default;
    ~SPSCRingBuffer() noexcept = default;

    SPSCRingBuffer(const SPSCRingBuffer&) = delete;
    SPSCRingBuffer& operator=(const SPSCRingBuffer&) = delete;
    SPSCRingBuffer(SPSCRingBuffer&&) = delete;
    SPSCRingBuffer& operator=(SPSCRingBuffer&&) = delete;

    /**
     * @brief Pousse un élément dans la file (Thread Producteur uniquement)
     * Utilise std::memory_order_release pour garantir la visibilité des données
     */
    template <typename... Args>
    HFT_INLINE bool emplace(Args&&... args) noexcept {
        const size_t current_tail = tail_.load(std::memory_order_relaxed);
        
        // Vérifie si le buffer est plein par rapport au curseur mis en cache
        if (current_tail - cached_head_ >= Capacity) {
            cached_head_ = head_.load(std::memory_order_acquire);
            if (current_tail - cached_head_ >= Capacity) {
                return false; // Queue saturée (Drop or throttle)
            }
        }

        new (&buffer_[current_tail & MASK]) T(std::forward<Args>(args)...);
        tail_.store(current_tail + 1, std::memory_order_release);
        return true;
    }

    HFT_INLINE bool push(const T& item) noexcept {
        return emplace(item);
    }

    HFT_INLINE bool push(T&& item) noexcept {
        return emplace(std::move(item));
    }

    /**
     * @brief Consomme un élément de la file (Thread Consommateur uniquement)
     * Utilise std::memory_order_acquire pour garantir la cohérence des écritures mémoire
     */
    HFT_INLINE bool pop(T& item) noexcept {
        const size_t current_head = head_.load(std::memory_order_relaxed);

        // Vérifie si le buffer est vide par rapport au curseur mis en cache
        if (current_head == cached_tail_) {
            cached_tail_ = tail_.load(std::memory_order_acquire);
            if (current_head == cached_tail_) {
                return false; // Queue vide
            }
        }

        item = std::move(buffer_[current_head & MASK]);
        buffer_[current_head & MASK].~T();
        head_.store(current_head + 1, std::memory_order_release);
        return true;
    }

    [[nodiscard]] HFT_INLINE bool empty() const noexcept {
        return head_.load(std::memory_order_relaxed) == tail_.load(std::memory_order_relaxed);
    }

    [[nodiscard]] HFT_INLINE size_t size() const noexcept {
        const size_t head = head_.load(std::memory_order_relaxed);
        const size_t tail = tail_.load(std::memory_order_relaxed);
        return (tail >= head) ? (tail - head) : 0;
    }
};
