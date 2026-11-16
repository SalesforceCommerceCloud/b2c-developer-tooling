'use strict';

/**
 * Adds loyalty points for an order.
 */
exports.awardPoints = function (order) {
    order.custom.loyaltyPoints = Math.floor(order.totalGrossPrice.value);
};

/**
 * Not called anywhere yet.
 */
exports.revokePoints = function (order) {
    order.custom.loyaltyPoints = 0;
};
