'use strict';

var server = require('server');
var URLUtils = require('dw/web/URLUtils');

server.get('Page', function (req, res, next) {
  var redirectUrl = URLUtils.url('Page-Show').toString() + '?' + req.querystring.toString();
  res.redirect(redirectUrl);
  next();
});

server.get('Path', function (req, res, next) {
  res.redirect('/on/demandware.store/Sites-RefArch-Site/default/Search-Show?q=' + req.querystring.q);
  next();
});

server.get('Checked', function (req, res, next) {
  var url = req.querystring.Location.stringValue;
  var allowed = new RegExp('^https?://' + req.httpHost + '(?=/|$)');
  var location;
  if (!url || !allowed.test(url)) {
    location = URLUtils.httpHome().toString();
  } else {
    location = url;
  }
  res.redirect(location);
  next();
});

function switchToHttps() {
  var url = 'https://' + request.httpHost + request.httpPath;
  url += '?' + request.httpQueryString;
  response.redirect(url);
}

module.exports = server.exports();
module.exports.switchToHttps = switchToHttps;
