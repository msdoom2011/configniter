module.exports = function(grunt)
{
    var path = require('path');
    var tasksPath = path.join(process.cwd(), 'tools/tasks');
    var configsPath = path.join(process.cwd(), 'tools/configs');
    var userConfig = require(path.join(configsPath, 'build.config.js'));
    var packageConfig = grunt.file.readJSON('package.json');

    require('time-grunt')(grunt);
    require('load-grunt-config')(grunt, {
        configPath: tasksPath,
        postProcess: function(taskConfig) {
            grunt.util._.extend(taskConfig, { package: packageConfig });
            grunt.util._.extend(taskConfig, userConfig);
        }
    });
};