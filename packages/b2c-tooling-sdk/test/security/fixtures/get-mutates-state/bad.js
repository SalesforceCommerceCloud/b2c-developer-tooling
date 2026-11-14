'use strict';

var server = require('server');
var Transaction = require('dw/system/Transaction');
var BasketMgr = require('dw/order/BasketMgr');

server.get('AddCoupon', function (req, res, next) {
  var basket = BasketMgr.getCurrentBasket();
  Transaction.wrap(function () {
    basket.createCouponLineItem(req.querystring.couponCode, true); // expect
  });
  next();
});

server.get('SetPreference', function (req, res, next) {
  Transaction.wrap(function () {
    customer.profile.custom.preferredStore = req.querystring.storeId; // expect
  });
  next();
});

module.exports = server.exports();
