var path = require('path');
var buildDir = 'build';

if (process.env.NODE_ENV === 'production') {
    buildDir = "dist";
}

module.exports = {
    package: require(path.resolve(process.cwd(), 'package.json')),
    host: "<%= package.config.dev_host %>",
    port: "<%= package.config.dev_port %>",
    src: {
        dir: "src"
    },
    build: {
        dir: buildDir
    },
    tests: {
        dir: "tests"
    }
};