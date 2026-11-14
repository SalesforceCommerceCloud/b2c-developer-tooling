'use strict';

var WeakCipher = require('dw/crypto/WeakCipher'); // expect
var Cipher = require('dw/crypto/Cipher');
var MessageDigest = require('dw/crypto/MessageDigest');
var Mac = require('dw/crypto/Mac');

function legacyEncrypt(value, key) {
  var cipher = new Cipher();
  return cipher.encrypt(value, key, 'DES/CBC/PKCS5Padding', null, 0); // expect
}

function ecb(value, key) {
  return new Cipher().encrypt(value, key, 'AES/ECB/PKCS5Padding', null, 0); // expect
}

function digest(value) {
  return new MessageDigest('MD5').digest(value); // expect
}

function sign(value, key) {
  return new Mac('HmacSHA1').digest(value, key); // expect
}

function inlineRequire(value) {
  return new (require('dw/crypto/MessageDigest'))('SHA-1').digest(value); // expect
}

function namespaced() {
  return new dw.crypto.WeakMessageDigest(dw.crypto.WeakMessageDigest.DIGEST_MD5); // expect
}

module.exports = {
  legacyEncrypt: legacyEncrypt,
  ecb: ecb,
  digest: digest,
  sign: sign,
  namespaced: namespaced,
  inlineRequire: inlineRequire,
  WeakCipher: WeakCipher,
};
