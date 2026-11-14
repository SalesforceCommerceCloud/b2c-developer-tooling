'use strict';

var server = require('server');

server.extend(module.superModule);

// Save the loyalty opt-in along with the profile.
server.replace('SaveProfile', function (req, res, next) {
    var Transaction = require('dw/system/Transaction');
    var profile = req.currentCustomer.raw.profile;
    Transaction.wrap(function () {
        profile.setFirstName(req.form.firstName);
        profile.setLastName(req.form.lastName);
        profile.custom.loyaltyOptIn = req.form.loyaltyOptIn === 'true';
    });
    res.json({success: true});
    next();
});

module.exports = server.exports();
