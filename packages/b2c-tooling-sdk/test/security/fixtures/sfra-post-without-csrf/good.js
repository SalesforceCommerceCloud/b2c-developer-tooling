'use strict';

var server = require('server');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var userLoggedIn = require('*/cartridge/scripts/middleware/userLoggedIn');

server.post('SaveAddress', userLoggedIn.validateLoggedInAjax, csrfProtection.validateAjaxRequest, function (req, res, next) {
  next();
});

server.post('SubmitForm', server.middleware.https, csrfProtection.validateRequest, function (req, res, next) {
  next();
});

server.post('InHandler', function (req, res, next) {
  var CSRFProtection = require('dw/web/CSRFProtection');
  if (!CSRFProtection.validateRequest()) {
    res.setStatusCode(403);
  }
  next();
});

server.get('Show', function (req, res, next) {
  next();
});

server.use('Page', function (req, res, next) {
  res.render('page', {q: req.querystring.q});
  next();
});

module.exports = server.exports();
