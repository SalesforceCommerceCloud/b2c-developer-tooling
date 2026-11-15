'use strict';

var server = require('server');
var Site = require('dw/system/Site');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var notifications = require('*/cartridge/scripts/middleware/notifications');

server.post('SharedToken', server.middleware.https, function (req, res, next) {
  var token = Site.current.preferences.custom.callbackToken;
  if (token !== req.httpHeaders['x-auth-token']) {
    res.setStatusCode(401);
    return next();
  }
  res.json({body: request.httpParameterMap.requestBodyAsString.length});
  return next();
});

server.post('Signed', server.middleware.https, function (req, res, next) {
  if (!helpers.verifySignature(req.body, req.httpHeaders.get('x-signature'))) {
    res.setStatusCode(401);
    return next();
  }
  res.json({ok: true});
  return next();
});

server.post('Middleware', server.middleware.https, notifications.validateRequest, function (req, res, next) {
  res.json({ok: JSON.parse(req.body).id});
  return next();
});

server.post('Ajax', csrfProtection.validateAjaxRequest, function (req, res, next) {
  res.json({ok: JSON.parse(req.body).id});
  return next();
});

server.post('Shopper', function (req, res, next) {
  var basket = require('dw/order/BasketMgr').getCurrentBasket();
  res.json({ok: JSON.parse(req.body).id, basket: Boolean(basket)});
  return next();
});

server.post('Form', function (req, res, next) {
  res.json({email: req.form.email});
  return next();
});

module.exports = server.exports();
