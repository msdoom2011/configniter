module.exports = {
    build: {
        entry: "./src/ConfIgniter.ts",
        devtool: "source-map",
        output: {
            filename: "conf-igniter.js",
            path: path.resolve(process.cwd(), '<%= build.dir %>'),
            publicPath: ""
        },
        module: {
            rules: [
                {test: /\.ts$/i, use: "ts-loader"}
            ]
        },
        resolve: {
            extensions: ['.ts', '.tsx', '.js']
        },
        watch: false,
        watchOptions: {
            ignored: /node_modules/
        }
    }
};