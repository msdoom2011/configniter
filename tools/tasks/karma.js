module.exports = {
    options: {
        configFile: "karma.conf.js"
    },
    test: {
        files: [
            { src: ["<%= build.dir %>/conf-igniter.js"] },
            { src: ["<%= tests.dir %>/**/*.spec.js"] }
        ]
    }
};