'use strict';

var helpers = require('*/cartridge/scripts/helpers/productHelpers');

function component(containerType, typeId) {
  return require('*/cartridge/experience/' + containerType + '/' + typeId.replace(/\./g, '/'));
}

function model(name) {
  return require('./models/' + name + 'Model');
}

module.exports = {helpers: helpers, component: component, model: model};

var Paths = {};
Paths.SCRIPTS = '~/cartridge/scripts/';
Paths.HELPER = Paths.SCRIPTS + 'helpers/basketHelper';
var BASE = '*/cartridge/scripts/';

function helpers() {
  return [require(Paths.HELPER), require(Paths.SCRIPTS + 'helpers/other'), require(BASE + 'util'), require(`${BASE}x`)];
}

module.exports.helpers = helpers;
