const path = require('path');
module.exports = {
  publicPath: process.env.NODE_ENV === 'production' ? '/desktop/' : '/',
  outputDir: path.resolve(__dirname, '../prod/desktop'),
  devServer: {
    proxy: 'http://localhost:5050',
  },
  configureWebpack: {
    devtool: 'cheap-source-map',
  },
  transpileDependencies: ['vuetify'],
};
