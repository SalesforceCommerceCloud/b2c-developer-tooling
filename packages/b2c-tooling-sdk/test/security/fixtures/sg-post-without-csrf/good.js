'use strict';

var guard = require('~/cartridge/scripts/guard');
var app = require('~/cartridge/scripts/app');

function submit() {
  app.getForm('profile').handleAction({
    confirm: function () {}
  });
}

function checked() {
  var CSRFProtection = require('dw/web/CSRFProtection');
  if (!CSRFProtection.validateRequest()) {
    return;
  }
}

function show() {
  app.getView({q: request.httpParameterMap.q.stringValue}).render('page');
}

exports.Submit = guard.ensure(['post', 'https', 'csrf'], submit);
exports.Checked = guard.ensure(['post', 'https'], checked);
exports.Show = guard.ensure(['get', 'https'], show);
exports.Page = guard.ensure(['https'], show);
exports.Include = guard.ensure(['include'], submit);
