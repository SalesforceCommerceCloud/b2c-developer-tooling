'use strict';

var server = require('server');

server.get('Return', function (req, res, next) {
  res.redirect(req.querystring.returnUrl); // expect
  next();
});

server.get('Login', function (req, res, next) {
  var target = req.querystring.target.stringValue;
  res.redirect(target); // expect
  next();
});

server.post('Continue', function (req, res, next) {
  var host = req.form.host;
  res.redirect('https://' + host + '/cart'); // expect
  next();
});

server.get('Slash', function (req, res, next) {
  res.redirect('/' + req.querystring.path); // expect
  next();
});

function legacy() {
  response.redirect(request.httpParameterMap.location.stringValue); // expect
}

module.exports = server.exports();
module.exports.legacy = legacy;
