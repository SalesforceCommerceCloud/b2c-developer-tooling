'use strict';

var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var OrderMgr = require('dw/order/OrderMgr');
var CustomerMgr = require('dw/customer/CustomerMgr');
var SystemObjectMgr = require('dw/object/SystemObjectMgr');

function findSubscription(email) {
  return CustomObjectMgr.queryCustomObject('Subscription', "custom.email = '" + email + "'"); // expect
}

function findOrders(customerNo) {
  return OrderMgr.searchOrders(`customerNo = '${customerNo}'`, 'creationDate desc'); // expect
}

function findProfiles(lastName) {
  var query = "lastName = '" + lastName + "'";
  return CustomerMgr.searchProfiles(query, null); // expect
}

function process(status, fn) {
  OrderMgr.processOrders(fn, 'status = '.concat(status)); // expect
}

function systemObjects(type, id) {
  return SystemObjectMgr.querySystemObjects(type, 'ID = ' + id, null); // expect
}

module.exports = {
  findSubscription: findSubscription,
  findOrders: findOrders,
  findProfiles: findProfiles,
  process: process,
  systemObjects: systemObjects,
};
