'use strict';

// Mirrors SFRA's app_storefront_base scripts/util/collections.js shape: an
// untyped iteration helper over dw.util.Collection. The callback parameter
// deliberately has no JSDoc — inference derives its type from the collection
// argument travelling alongside it.
function forEach(collection, callback) {
  var it = collection.iterator();
  while (it.hasNext()) {
    callback(it.next());
  }
}

// Stock SFRA shape: ternary return through iterator.next(). Inference must
// chase both branches so a typed call-site collection yields an element type.
function first(collection) {
  var iterator = collection.iterator();
  return iterator.hasNext() ? iterator.next() : null;
}

// Stock SFRA shape: the matching element, or null. Its result depends on the
// collection each call passes, so inference re-reads it per call.
function find(collection, match) {
  var result = null;
  var iterator = collection.iterator();
  while (iterator.hasNext()) {
    var item = iterator.next();
    if (match(item)) {
      result = item;
      break;
    }
  }
  return result;
}

module.exports = {
  forEach: forEach,
  first: first,
  find: find,
};
