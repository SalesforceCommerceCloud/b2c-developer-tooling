'use strict';

var server = require('server');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var userLoggedIn = require('*/cartridge/scripts/middleware/userLoggedIn');

server.extend(module.superModule);

server.replace('SaveProfile', function (req, res, next) { // expect
  next();
});

server.replace('Show', userLoggedIn.validateLoggedIn, function (req, res, next) { // expect
  next();
});

server.replace('Keep', server.middleware.post, csrfProtection.validateAjaxRequest, function (req, res, next) {
  next();
});

server.replace('Header', server.middleware.get, function (req, res, next) {
  next();
});

module.exports = server.exports();
