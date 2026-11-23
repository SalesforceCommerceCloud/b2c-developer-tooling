'use strict';

var Cookie = require('dw/web/Cookie');

function remember(value) {
  var cookie = new Cookie('remember', value); // expect
  cookie.setMaxAge(3600);
  response.addHttpCookie(cookie);
}

function secureOnly(value) {
  var cookie = new Cookie('prefs', value); // expect
  cookie.setSecure(true);
  response.addHttpCookie(cookie);
}

function inline(value) {
  response.addHttpCookie(new Cookie('tracking', value)); // expect
}

function namespaced(value) {
  var c = new dw.web.Cookie('legacy', value); // expect
  c.httpOnly = true;
  response.addHttpCookie(c);
}

module.exports = {remember: remember, secureOnly: secureOnly, inline: inline, namespaced: namespaced};
