'use strict';

var server = require('server');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var userLoggedIn = require('*/cartridge/scripts/middleware/userLoggedIn');

server.post('SaveProfile', server.middleware.https, userLoggedIn.validateLoggedInAjax, csrfProtection.validateAjaxRequest, function (req, res, next) {
  next();
});

server.get('Show', server.middleware.https, userLoggedIn.validateLoggedIn, function (req, res, next) {
  next();
});

server.post('Keep', csrfProtection.validateAjaxRequest, function (req, res, next) {
  next();
});

server.get('Header', function (req, res, next) {
  next();
});

module.exports = server.exports();
