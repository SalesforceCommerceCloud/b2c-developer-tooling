'use strict';

var Cipher = require('dw/crypto/Cipher');
var MessageDigest = require('dw/crypto/MessageDigest');
var Mac = require('dw/crypto/Mac');

function encrypt(value, key, iv) {
  return new Cipher().encrypt(value, key, 'AES/GCM/NoPadding', iv, 0);
}

function digest(value) {
  return new MessageDigest(MessageDigest.DIGEST_SHA_256).digest(value);
}

function sign(value, key) {
  return new Mac(Mac.HMAC_SHA_256).digest(value, key);
}

module.exports = {encrypt: encrypt, digest: digest, sign: sign};
