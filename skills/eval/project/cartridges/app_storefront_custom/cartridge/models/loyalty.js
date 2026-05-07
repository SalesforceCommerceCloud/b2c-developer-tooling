'use strict';

/**
 * Loyalty data model
 * @param {dw.customer.Customer} customer - the current customer
 */
function LoyaltyModel(customer) {
    this.points = customer.profile ? customer.profile.custom.loyaltyPoints || 0 : 0;
    this.tier = customer.profile ? customer.profile.custom.loyaltyTier || 'bronze' : 'bronze';
    this.isEnrolled = this.points > 0;
}

module.exports = LoyaltyModel;
