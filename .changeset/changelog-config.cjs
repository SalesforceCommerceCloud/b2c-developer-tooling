const github = require("@changesets/changelog-github");
const base = github.default;

module.exports.default = {
  getDependencyReleaseLine: base.getDependencyReleaseLine,
  getReleaseLine: async (...args) => {
    const line = await base.getReleaseLine(...args);
    // Move "Thanks @user!" from before the description to after it
    return line.replace(/ Thanks ([^!]+!)( -)(.+)/, "$2$3 (Thanks $1)");
  },
};
