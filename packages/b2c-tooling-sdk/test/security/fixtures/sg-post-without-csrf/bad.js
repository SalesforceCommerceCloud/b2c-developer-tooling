'use strict';

var guard = require('~/cartridge/scripts/guard');
var app = require('~/cartridge/scripts/app');

function submit() {
  app.getForm('contactus').handleAction({
    send: function () {}
  });
}

function addProduct() {}

exports.Submit = guard.ensure(['post', 'https'], submit); // expect
exports.AddProduct = guard.ensure(['post'], addProduct); // expect
exports.Save = guard.httpsPost(submit); // expect
exports.Handle = guard.ensure(['https'], submit); // expect
