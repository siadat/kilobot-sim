module.exports = {
  entry: "./kilolib.js",
  node: { fs: "empty" },
  output: {
    filename: "bundle.js",
  },
  watchOptions: {
    ignored: /(node_modules|vendor)/,
  },
  module: {
    rules: [
      {
        enforce: "pre",
        test: /\.js$/,
        exclude: /(node_modules|vendor)/,
        use: [
          {
            loader: "babel-loader",
            options: {
              cacheDirectory: true,
              presets: ["@babel/preset-env"],
            },
          },
          {
            loader: "eslint-loader",
          },
        ],
      },
    ],
  },
};
