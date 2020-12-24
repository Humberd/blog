const webpack = require('webpack');
const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const AssetsPlugin = require('assets-webpack-plugin');

module.exports = {
  entry: {
    main: path.join(__dirname, 'src', 'index.ts'),
    post: path.join(__dirname, 'src', 'post.ts'),
  },

  output: {
    path: path.join(__dirname, 'dist'),
    publicPath: '/',
  },

  module: {
    rules: [
      {
        test: /\.((png)|(eot)|(woff)|(woff2)|(ttf)|(svg)|(gif))(\?v=\d+\.\d+\.\d+)?$/,
        loader: 'file-loader',
        options: {
          name: '[hash].[ext]',
        },
      },

      {test: /\.json$/, loader: 'json-loader'},

      {
        loader: 'ts-loader',
        test: /\.tsx?$/,
        exclude: /node_modules/,
        options: {
          configFile: 'tsconfig.prod.json',
        },
      },

      {
        test: /\.(sa|sc|c)ss$/,
        exclude: /node_modules/,
        use: [
          'style-loader', {
            loader: MiniCssExtractPlugin.loader,
            options: {
              esModule: false,
            },
          }, 'css-loader', 'sass-loader'],
      },
    ],
  },

  resolve: {
    extensions: ['.ts', '.js'],
  },

  plugins: [
    new AssetsPlugin({
      filename: 'webpack.json',
      path: path.join(process.cwd(), 'site/data'),
      prettyPrint: true,
    }),

    new CopyPlugin({
      patterns: [
        {
          from: './src/fonts/',
          to: 'fonts/',
        },
      ],
    }),
  ],
};
