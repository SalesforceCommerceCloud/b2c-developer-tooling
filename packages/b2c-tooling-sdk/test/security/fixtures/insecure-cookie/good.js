'use strict';

var Cookie = require('dw/web/Cookie');

function remember(value) {
  var cookie = new Cookie('remember', value);
  cookie.setSecure(true);
  cookie.setHttpOnly(true);
  response.addHttpCookie(cookie);
}

function properties(value) {
  var cookie = new Cookie('prefs', value);
  cookie.secure = true;
  cookie.httpOnly = true;
  response.addHttpCookie(cookie);
}

function clear() {
  var cookie = new Cookie('remember', '');
  cookie.setMaxAge(0);
  response.addHttpCookie(cookie);
}

module.exports = {remember: remember, properties: properties, clear: clear};
