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

module.exports = {
  forEach: forEach
};
