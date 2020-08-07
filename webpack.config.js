/* eslint-disable @typescript-eslint/no-var-requires */
const { join } = require("path");

const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const WebpackBarPlugin = require("webpackbar");

module.exports = {
  target: "web",

  mode,

  entry: {
    main: join(__dirname, "src", "example", "client", "main.tsx"),
  },

  output: {
    path: join(__dirname, "build"),
    publicPath: "/",
  },

  resolve: {
    extensions: [".ts", ".tsx", ".js", ".jsx"],
  },

  devServer: {
    open: true,
    port: 8000,
    historyApiFallback: {
      disableDotRule: true,
    },
    onListening: (server) => {
      const { address, port } = server.listeningApp.address();
      console.log(`Listening on http://${address}:${port}`);
    },
  },

  module: {
    rules: [
      {
        test: /\.(j|t)sx?$/,
        exclude: /node_modules/,
        use: [{ loader: "babel-loader" }],
      },
      {
        test: /\.js$/i,
        enforce: "pre",
        use: [
          {
            loader: "source-map-loader",
          },
        ],
      },
    ],
  },

  node: {
    fs: "empty",
    net: "empty",
    tls: "empty",
  },

  plugins: [
    new ForkTsCheckerWebpackPlugin({
      eslint: {
        files: "./src/**/*.{ts,tsx,js,jsx}",
      },
    }),
    new WebpackBarPlugin(),
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin(),
  ],
};
