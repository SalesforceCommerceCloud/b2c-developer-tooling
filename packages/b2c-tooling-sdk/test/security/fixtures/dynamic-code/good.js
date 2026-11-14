'use strict';

var helpers = require('*/cartridge/scripts/helpers/productHelpers');

function component(containerType, typeId) {
  return require('*/cartridge/experience/' + containerType + '/' + typeId.replace(/\./g, '/'));
}

function model(name) {
  return require('./models/' + name + 'Model');
}

module.exports = {helpers: helpers, component: component, model: model};
