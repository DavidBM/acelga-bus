const tsc = require('typescript');
const tsConfig = require('./tsconfig.json');

//source-map-support: Adds support for the source maps that typescrpts generate. Helpfull for debugging stack traces.
//require("source-map-support").install();

module.exports = {
  process(src, path) {
    if (path.endsWith('.ts') || path.endsWith('.tsx')) {
      return tsc.transpile(src, tsConfig.compilerOptions, path, []);
    }
    return src;
  },
};
