'use strict';

var server = require('server');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var userLoggedIn = require('*/cartridge/scripts/middleware/userLoggedIn');

server.get('Show', server.middleware.https, function (req, res, next) {
    res.render('account/accountDashboard');
    next();
});

server.post(
    'SaveProfile',
    server.middleware.https,
    userLoggedIn.validateLoggedInAjax,
    csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        var Transaction = require('dw/system/Transaction');
        var profile = req.currentCustomer.raw.profile;
        Transaction.wrap(function () {
            profile.setFirstName(req.form.firstName);
            profile.setLastName(req.form.lastName);
        });
        res.json({success: true});
        next();
    }
);

module.exports = server.exports();
