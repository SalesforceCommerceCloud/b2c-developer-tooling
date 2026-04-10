const Module = require('module');

const originalResolveFilename = Module._resolveFilename;

Module._resolveFilename = function (request, parent, isMain, options) {
  if (request === 'express') {
    return originalResolveFilename.call(this, 'express4', parent, isMain, options);
  }
  if (request.startsWith('express/')) {
    const mappedRequest = `express4/${request.slice('express/'.length)}`;
    return originalResolveFilename.call(this, mappedRequest, parent, isMain, options);
  }
  return originalResolveFilename.call(this, request, parent, isMain, options);
};
