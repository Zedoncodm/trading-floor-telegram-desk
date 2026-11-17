#pragma once

#include <cmath>
#include <cstdint>
#include <algorithm>
#include <string_view>

/**
 * @brief Modèle Avellaneda-Stoikov d'optimal market making en temps continu.
 * Calcule le prix de réserve (indifference price) et les spreads optimaux asymétriques
 * en fonction de l'inventaire actuel q, de la volatilité sigma, et de l'aversion au risque gamma.
 */
class AvellanedaStoikovPricer {
private:
    double gamma_;       // Paramètre d'aversion au risque (ex: 0.1 à 0.5)
    double sigma_;       // Volatilité instantanée de l'actif (estimée par EWMA ou ATR)
    double k_;           // Intensité des arrivées d'ordres de marché (liquidité du carnet)
    double time_horiz_;  // Horizon résiduel de la session T - t (en fraction de jour)

public:
    constexpr AvellanedaStoikovPricer(double gamma = 0.25, double sigma = 0.015, double k = 1.5, double time_horizon = 1.0) noexcept
        : gamma_(gamma), sigma_(sigma), k_(k), time_horiz_(time_horizon) {}

    /**
     * @brief Calcule le prix de réserve r(s, q, t)
     * r(s, q, t) = s - q * gamma * sigma^2 * (T - t)
     * Si inventaire positif q > 0 (trop long), le prix de réserve baisse pour inciter la vente.
     * Si inventaire négatif q < 0 (trop court), le prix de réserve monte pour inciter l'achat.
     */
    [[nodiscard]] inline double computeReservationPrice(double mid_price, double current_inventory, double time_remaining) const noexcept {
        const double horizon = std::max(1e-5, time_remaining);
        return mid_price - (current_inventory * gamma_ * (sigma_ * sigma_) * horizon);
    }

    /**
     * @brief Calcule le spread optimal total r_a + r_b
     * delta_a + delta_b = gamma * sigma^2 * (T - t) + (2 / gamma) * ln(1 + gamma / k)
     */
    [[nodiscard]] inline double computeOptimalSpread(double time_remaining) const noexcept {
        const double horizon = std::max(1e-5, time_remaining);
        const double vol_term = gamma_ * (sigma_ * sigma_) * horizon;
        const double liquidity_term = (2.0 / gamma_) * std::log(1.0 + (gamma_ / k_));
        return vol_term + liquidity_term;
    }

    /**
     * @brief Calcule la cotation asymétrique optimale des limites [Optimal Bid, Optimal Ask]
     */
    inline void computeQuotes(double mid_price, double current_inventory, double time_remaining, double& out_bid, double& out_ask) const noexcept {
        const double r = computeReservationPrice(mid_price, current_inventory, time_remaining);
        const double half_spread = computeOptimalSpread(time_remaining) * 0.5;
        out_bid = r - half_spread;
        out_ask = r + half_spread;
    }
};

/**
 * @brief Analyseur de microstructure haute fréquence :
 * Calcul incrémental sans boucle de l'Order Flow Imbalance (OFI) L2 avec règle de Lee-Ready.
 */
class MicrostructureAnalyzer {
private:
    double prev_best_bid_{0.0};
    double prev_bid_qty_{0.0};
    double prev_best_ask_{0.0};
    double prev_ask_qty_{0.0};

    // Statistiques en ligne EWMA pour normalisation Z-Score de l'OFI
    double ofi_mean_{0.0};
    double ofi_var_{1.0};
    double alpha_{0.05}; // Facteur d'oubli EWMA

public:
    constexpr MicrostructureAnalyzer() noexcept = default;

    /**
     * @brief Met à jour le flux L2 et calcule l'Order Flow Imbalance incrémental
     * OFI_t = e_bid * Delta(BidQty) - e_ask * Delta(AskQty)
     */
    inline double updateOrderFlowImbalance(double best_bid, double bid_qty, double best_ask, double ask_qty) noexcept {
        if (prev_best_bid_ == 0.0) {
            prev_best_bid_ = best_bid;
            prev_bid_qty_ = bid_qty;
            prev_best_ask_ = best_ask;
            prev_ask_qty_ = ask_qty;
            return 0.0;
        }

        double delta_bid = 0.0;
        if (best_bid > prev_best_bid_) {
            delta_bid = bid_qty; // Nouvelle liquidité au-dessus
        } else if (best_bid == prev_best_bid_) {
            delta_bid = bid_qty - prev_bid_qty_;
        } else {
            delta_bid = -prev_bid_qty_; // Niveau enfoncé
        }

        double delta_ask = 0.0;
        if (best_ask < prev_best_ask_) {
            delta_ask = ask_qty; // Vente agressive au-dessous
        } else if (best_ask == prev_best_ask_) {
            delta_ask = ask_qty - prev_ask_qty_;
        } else {
            delta_ask = -prev_ask_qty_;
        }

        const double ofi = delta_bid - delta_ask;

        // Mise à jour EWMA
        ofi_mean_ = (1.0 - alpha_) * ofi_mean_ + alpha_ * ofi;
        const double diff = ofi - ofi_mean_;
        ofi_var_ = (1.0 - alpha_) * ofi_var_ + alpha_ * (diff * diff);

        // Sauvegarde de l'état précédent
        prev_best_bid_ = best_bid;
        prev_bid_qty_ = bid_qty;
        prev_best_ask_ = best_ask;
        prev_ask_qty_ = ask_qty;

        return ofi;
    }

    [[nodiscard]] inline double getOfiZScore(double current_ofi) const noexcept {
        const double std_dev = std::sqrt(std::max(1e-6, ofi_var_));
        return (current_ofi - ofi_mean_) / std_dev;
    }

    /**
     * @brief Classification de trade par l'algorithme Lee-Ready (Tick Test / Quote Rule)
     */
    [[nodiscard]] static inline int classifyTrade(double trade_price, double best_bid, double best_ask, double prev_trade_price) noexcept {
        const double mid = (best_bid + best_ask) * 0.5;
        if (trade_price > mid) return 1;  // Buyer-initiated (Achat agressif)
        if (trade_price < mid) return -1; // Seller-initiated (Vente agressive)
        
        // Quote Rule indécise : repli sur le Tick Test
        if (trade_price > prev_trade_price) return 1;
        if (trade_price < prev_trade_price) return -1;
        return 0;
    }
};
