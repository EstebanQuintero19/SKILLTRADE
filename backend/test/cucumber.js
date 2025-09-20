const common = [
  'test/**/*.feature',
  '--require-module ts-node/register',
  '--require test/**/*.ts',
  '--require test/**/*.js',
  '--format progress-bar',
  '--format @cucumber/pretty-formatter',
  '--publish-quiet'
].join(' ');

module.exports = {
  default: common,
  unit: `${common} --tags "@unit"`,
  integration: `${common} --tags "@integration"`,
  all: common
};
