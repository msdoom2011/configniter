var lodash = require('lodash');
var webpackConfig = lodash.clone(require('./webpack').build);

webpackConfig.watch = true;

module.exports = process.env.NODE_ENV === 'production' ? {} : {
    options: {
        webpack: webpackConfig
    },
    server: {
        contentBase: "<%= webpack.build.output.path %>",
        publicPath: "<%= webpack.build.output.publicPath %>",
        host: "<%= host %>",
        port: "<%= port %>",
        compress: true,
        hot: true
    }
};