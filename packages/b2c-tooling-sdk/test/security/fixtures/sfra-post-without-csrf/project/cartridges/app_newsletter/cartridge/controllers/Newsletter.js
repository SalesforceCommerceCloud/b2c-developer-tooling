'use strict';

var server = require('server');

// An overlay cartridge prepends the CSRF check, so the composed route is protected.
server.post('Join', function (req, res, next) {
  next();
});

// Nothing protects this one.
server.post('Leave', function (req, res, next) { // expect
  next();
});

module.exports = server.exports();
