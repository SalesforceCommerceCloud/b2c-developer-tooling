'use strict';

var server = require('server');
var OrderMgr = require('dw/order/OrderMgr');

server.post('Notification', server.middleware.https, function (req, res, next) { // expect
  var body = JSON.parse(request.httpParameterMap.requestBodyAsString);
  var order = OrderMgr.getOrder(body.orderNo);
  res.json({ok: Boolean(order)});
  return next();
});

function handleCallback(req, res, next) {
  var event = JSON.parse(req.body);
  res.json({received: event.id});
  return next();
}

server.post('Callback', handleCallback); // expect

server.post('Sign', function (req, res, next) { // expect
  var data = JSON.parse(req.body);
  res.json({signature: helpers.generateSignature(data.stringToSign)});
  return next();
});

module.exports = server.exports();
