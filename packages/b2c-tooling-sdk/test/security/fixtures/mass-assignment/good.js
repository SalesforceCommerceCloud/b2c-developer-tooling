'use strict';

var ALLOWED = ['newsletter', 'preferredStore'];

function save(profile, req) {
  profile.custom.newsletter = req.form.newsletter === 'true';
  ALLOWED.forEach(function (key) {
    profile.custom[key] = req.form[key];
  });
}

function copyLocal(req) {
  var view = {};
  Object.keys(req.form).forEach(function (key) {
    view[key] = req.form[key];
  });
  return view;
}

module.exports = {save: save, copyLocal: copyLocal};
