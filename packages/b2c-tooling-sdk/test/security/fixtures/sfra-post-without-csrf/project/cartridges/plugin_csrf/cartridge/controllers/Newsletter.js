'use strict';

var server = require('server');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');

server.extend(module.superModule);
server.prepend('Join', csrfProtection.validateAjaxRequest);

module.exports = server.exports();
