'use strict';

var server = require('server');

server.get('Show', function (req, res, next) {
    var LoyaltyModel = require('*/cartridge/models/loyalty');
    var loyaltyData = new LoyaltyModel(req.currentCustomer.raw);

    res.render('loyalty/dashboard', {
        loyalty: loyaltyData
    });

    next();
});

module.exports = server.exports();
