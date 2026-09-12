'use strict';

// SFRA controller shape. The `modules` cartridge in this fixture makes the
// plugin inject its bundled SFRA ambient declarations, whose typed
// `append(name, ...middleware)` signature lets TypeScript type `req`, `res`
// and `next` contextually — no usage inference involved (or wanted) here.
var server = require('server');

server.append('Show', function (req, res, next) {
  var qs = req.querystring;
  if (qs) {
    next();
    return;
  }
  next();
});

module.exports = server.exports();
