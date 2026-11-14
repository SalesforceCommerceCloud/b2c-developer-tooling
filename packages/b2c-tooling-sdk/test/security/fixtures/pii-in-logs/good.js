'use strict';

var Logger = require('dw/system/Logger');
var log = Logger.getLogger('checkout', 'payment');

function logs(customer, order, err) {
  Logger.info('Customer {0} logged in', customer.profile.customerNo);
  log.debug('Order placed: {0}', order.orderNo);
  log.error('Payment failed: {0}', err.message);
  var console = {info: function () {}};
  console.info(customer.profile.email);
}

module.exports = {logs: logs};
