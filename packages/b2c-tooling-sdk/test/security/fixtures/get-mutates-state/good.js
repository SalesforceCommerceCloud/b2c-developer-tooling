'use strict';

var server = require('server');
var Transaction = require('dw/system/Transaction');
var BasketMgr = require('dw/order/BasketMgr');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');

server.get('Show', function (req, res, next) {
  var basket = BasketMgr.getCurrentBasket();
  Transaction.wrap(function () {
    basket.updateTotals();
  });
  next();
});

server.get('AddCouponChecked', csrfProtection.validateAjaxRequest, function (req, res, next) {
  var basket = BasketMgr.getCurrentBasket();
  Transaction.wrap(function () {
    basket.createCouponLineItem(req.querystring.couponCode, true);
  });
  next();
});

server.post('AddCouponPost', csrfProtection.validateAjaxRequest, function (req, res, next) {
  var basket = BasketMgr.getCurrentBasket();
  Transaction.wrap(function () {
    basket.createCouponLineItem(req.form.couponCode, true);
  });
  next();
});

module.exports = server.exports();
