'use strict';

var server = require('server');
var userLoggedIn = require('*/cartridge/scripts/middleware/userLoggedIn');

server.get('Points', server.middleware.https, userLoggedIn.validateLoggedInAjax, function (req, res, next) {
    res.json({points: req.currentCustomer.raw.profile.custom.loyaltyPoints || 0});
    next();
});

server.post('Award', server.middleware.https, userLoggedIn.validateLoggedInAjax, function (req, res, next) {
    var HookMgr = require('dw/system/HookMgr');
    var OrderMgr = require('dw/order/OrderMgr');
    var order = OrderMgr.getOrder(req.form.orderID);
    HookMgr.callHook('app.loyalty.order', 'awardPoints', order);
    res.json({success: true});
    next();
});

module.exports = server.exports();
