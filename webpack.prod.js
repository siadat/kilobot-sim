const webpack = require("webpack");
const merge = require("webpack-merge");
const common = require("./webpack.js");
const UglifyJSPlugin = require("uglifyjs-webpack-plugin");

module.exports = merge(common, {
  mode: "production",
  devtool: "source-map",
  plugins: [
    new UglifyJSPlugin({
      // uglifyOptions: {
      //   drop_console: true,
      // },
      sourceMap: true,
    }),
  ],
  output: {
    filename: "bundle.min.js",
  },
  performance: {
    hints: "warning",
    maxEntrypointSize: 800000,
    maxAssetSize: 800000,
  },
});
