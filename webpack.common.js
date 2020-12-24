const webpack = require('webpack');
const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const AssetsPlugin = require('assets-webpack-plugin');

module.exports = {
  entry: {
    main: path.join(__dirname, 'src', 'index.ts'),
    post: path.join(__dirname, 'src', 'post.ts'),
  },

  output: {
    path: path.join(__dirname, 'dist'),
  },

  module: {
    rules: [
      {
        test: /\.((png)|(eot)|(woff)|(woff2)|(ttf)|(svg)|(gif))(\?v=\d+\.\d+\.\d+)?$/,
        loader: 'file-loader?name=/[hash].[ext]',
      },

      {test: /\.json$/, loader: 'json-loader'},

      {
        loader: 'ts-loader',
        test: /\.tsx?$/,
        exclude: /node_modules/,
      },

      {
        test: /\.(sa|sc|c)ss$/,
        exclude: /node_modules/,
        use: ['style-loader', MiniCssExtractPlugin.loader, 'css-loader', 'postcss-loader', 'sass-loader'],
      },
    ],
  },

  resolve: {
    extensions: ['.ts', '.js']
  },

  plugins: [
    new AssetsPlugin({
      filename: 'webpack.json',
      path: path.join(process.cwd(), 'site/data'),
      prettyPrint: true,
    }),

    new CopyWebpackPlugin([
      {
        from: './src/fonts/',
        to: 'fonts/',
        flatten: true,
      },
    ]),
  ],
};
