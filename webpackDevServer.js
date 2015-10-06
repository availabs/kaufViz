var webpack = require('webpack');
var WebpackDevServer = require('webpack-dev-server');
var config = require('./webpack.config');

console.info('================WEBPACK=======================')
new WebpackDevServer(webpack(config), {
  publicPath: config.output.publicPath,
  hot: true,
  noInfo: true, 
  historyApiFallback: true,
  headers: { 'Access-Control-Allow-Origin': 'http://localhost:1337' },
}).listen(11237, 'localhost', function (err, result) {
  if (err) {
    console.log(err);
  }

  console.info('Listening at localhost:11237');
});
