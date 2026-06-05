'use strict';

/**
 * Home page controller
 */

var server = require('server');

server.get('Show', function (req, res, next) {
  var Site = require('dw/system/Site');
  var URLUtils = require('dw/web/URLUtils');

  res.render('home/homepage', {
    site: Site.current.name,
    homeUrl: URLUtils.home().toString(),
  });

  next();
});

module.exports = server.exports();
