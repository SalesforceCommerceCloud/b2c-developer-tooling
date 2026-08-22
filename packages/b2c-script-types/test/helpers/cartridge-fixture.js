'use strict';

const {realTypesPrelude} = require('./real-dw-types');

/**
 * Builds the absolute in-memory path for a file inside a named cartridge.
 *
 * @param {string} cartridgeName
 * @param {string} relativePath - path relative to cartridge root, e.g. `cartridge/scripts/helpers/foo.js`
 * @returns {string}
 */
function absoluteCartridgePath(cartridgeName, relativePath) {
  const normalized = relativePath.replace(/\\/g, '/').replace(/^\/+/, '');
  return `/cartridges/${cartridgeName}/${normalized}`;
}

/**
 * Builds a cartridge `src` root used in plugin cartridge config.
 *
 * @param {string} cartridgeName
 * @returns {string}
 */
function cartridgeSrcRoot(cartridgeName) {
  return `/cartridges/${cartridgeName}/`;
}

/**
 * @param {object} opts
 * @param {Array<{name: string, files: Record<string,string>}>} opts.cartridges
 *   - `files` keys are paths relative to cartridge root, e.g. `cartridge/scripts/helpers/foo.js`
 *   - Absolute virtual paths will be `/cartridges/<name>/<rel>`
 * @param {string[]} [opts.dwTypes] - passed to realTypesPrelude if provided
 * @param {string} [opts.globals] - body of `declare global { ... }` when dwTypes is set
 * @param {string} [opts.extraDts] - full `/types.d.ts` content when dwTypes is omitted
 * @param {string[]} [opts.cartridgeOrder] - order for dw.json cartridges field; default = opts.cartridges map name
 * @returns {{
 *   files: Record<string,string>,
 *   dwJsonPath: string,
 *   cartridgeConfigs: Array<{name: string, src: string}>,
 *   createHostFiles: () => Record<string,string>,
 * }}
 */
function createCartridgeFixture(opts) {
  const {cartridges, dwTypes, globals, extraDts, cartridgeOrder} = opts;

  const files = {};
  const cartridgeConfigs = [];
  const jsIncludePaths = [];

  for (const cartridge of cartridges) {
    cartridgeConfigs.push({name: cartridge.name, src: cartridgeSrcRoot(cartridge.name)});

    for (const [relativePath, content] of Object.entries(cartridge.files)) {
      const absPath = absoluteCartridgePath(cartridge.name, relativePath);
      files[absPath] = content;
      if (relativePath.endsWith('.js')) {
        // jsconfig paths are relative to project root (/).
        jsIncludePaths.push(absPath.slice(1));
      }
    }
  }

  const dwJsonPath = '/dw.json';
  const order = cartridgeOrder ?? cartridges.map((c) => c.name);
  files[dwJsonPath] = JSON.stringify(
    {
      hostname: 'test-fixture.invalid',
      username: 'fixture-user',
      password: 'not-a-real-password',
      'code-version': 'version1',
      cartridges: order.join(':'),
    },
    null,
    2,
  );

  if (dwTypes && dwTypes.length > 0) {
    files['/types.d.ts'] = realTypesPrelude(dwTypes, globals ?? extraDts ?? '');
  } else if (extraDts) {
    files['/types.d.ts'] = extraDts;
  }

  if (jsIncludePaths.length > 0) {
    files['/jsconfig.json'] = JSON.stringify(
      {
        compilerOptions: {
          target: 'es5',
          module: 'commonjs',
          moduleResolution: 'node',
          allowJs: true,
          checkJs: false,
          noEmit: true,
        },
        include: jsIncludePaths,
      },
      null,
      2,
    );
  }

  return {
    files,
    dwJsonPath,
    cartridgeConfigs,
    createHostFiles: () => ({...files}),
  };
}

module.exports = {
  absoluteCartridgePath,
  cartridgeSrcRoot,
  createCartridgeFixture,
};
