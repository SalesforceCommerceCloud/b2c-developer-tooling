'use strict';

var server = require('server');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');

server.post('Subscribe', server.middleware.https, function (req, res, next) { // expect
  res.json({success: true});
  next();
});

server.use('SaveProfile', function (req, res, next) { // expect
  var form = req.form;
  res.json({email: form.email});
  next();
});

server.post('Generate', csrfProtection.generateToken, function (req, res, next) { // expect
  next();
});

module.exports = server.exports();
