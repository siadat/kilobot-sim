const webpack = require("webpack");
const merge = require("webpack-merge");
const common = require("./webpack.js");

module.exports = merge(common, {
  mode: "development",
  devtool: "inline-source-map",
  plugins: [
  ],
  devServer: {
    contentBase: "./dist",
  },
});
