'use strict';

function run(code) {
  return eval(code); // expect
}

function compile(body) {
  return new Function('a', body); // expect
}

function compileCall(body) {
  return Function('a', body); // expect
}

function load(name) {
  return require(name); // expect
}

function loadFromRequest() {
  return require('*/cartridge/scripts/' + request.httpParameterMap.helper.stringValue); // expect
}

module.exports = {run: run, compile: compile, compileCall: compileCall, load: load, loadFromRequest: loadFromRequest};
