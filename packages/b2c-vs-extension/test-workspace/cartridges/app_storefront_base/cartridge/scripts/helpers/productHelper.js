'use strict';

/**
 * Product helper functions
 */

/**
 * Get product availability
 * @param {dw.catalog.Product} product - Product object
 * @returns {Object} Availability object
 */
function getAvailability(product) {
  return {
    available: product.availabilityModel.availability > 0,
    inStock: product.availabilityModel.inStock,
    levels: product.availabilityModel.inventoryRecord.ATS.value,
  };
}

module.exports = {
  getAvailability: getAvailability,
};
