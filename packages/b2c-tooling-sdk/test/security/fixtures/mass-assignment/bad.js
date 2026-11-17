'use strict';

var Transaction = require('dw/system/Transaction');

function saveAll(req) {
  var profile = req.currentCustomer.raw.profile;
  Transaction.wrap(function () {
    Object.keys(req.form).forEach(function (key) {
      profile.custom[key] = req.form[key]; // expect
    });
  });
}

function saveLoop(order) {
  var params = request.httpParameterMap;
  for (var name in params) {
    order.custom[name] = params[name].stringValue; // expect
  }
}

function saveOne(profile) {
  profile.custom[request.httpParameterMap.attr.stringValue] = true; // expect
}

function merge(customer, req) {
  Object.assign(customer.profile.custom, req.form); // expect
}

module.exports = {saveAll: saveAll, saveLoop: saveLoop, saveOne: saveOne, merge: merge};
