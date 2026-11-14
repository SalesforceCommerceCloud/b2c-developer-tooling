'use strict';

var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var OrderMgr = require('dw/order/OrderMgr');

var EMAIL_QUERY = 'custom.email = {0}';

function findSubscription(email) {
  return CustomObjectMgr.queryCustomObject('Subscription', EMAIL_QUERY, email);
}

function findOrders(customerNo) {
  return OrderMgr.searchOrders('customerNo = {0} AND status != {1}', 'creationDate desc', customerNo, 8);
}

function constantQuery() {
  return CustomObjectMgr.queryCustomObjects('Subscription', 'custom.active = ' + 'true', null);
}

module.exports = {findSubscription: findSubscription, findOrders: findOrders, constantQuery: constantQuery};
