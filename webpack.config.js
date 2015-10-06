var path = require('path');
var webpack = require('webpack');

var webpackConfig;

if (process.env.NODE_ENV === 'development') {

    webpackConfig = {
        devtool: 'eval',
        entry: {bundle:[
          'webpack-dev-server/client?http://localhost:11237',
          'webpack/hot/only-dev-server',
          './assets/react/indexView.jsx',
        ]},
        output: {
          path: path.join(__dirname, '.tmp/public'),
          filename: '[name].js',
          //crossOriginLoading: "use-credentials",
          publicPath: 'http://localhost:11237/',
        },
        plugins: [
          new webpack.NoErrorsPlugin(),
          new webpack.HotModuleReplacementPlugin(),
          new webpack.optimize.OccurenceOrderPlugin(),
        ],
        resolve: {
          extensions: ['', '.js', '.jsx']
        },
        watch:true,
        module: {
          loaders: [{
            test: /\.jsx?$|react\.js/,
            loaders: ['react-hot', 'babel'],
            include: path.join(__dirname, 'assets'),
            exclude: /sails\.io\.js$|node_modules$|\w+\.topo\.js/
          },
          { test: /\.json$/, loader: "json-loader" }]
        },
        node: { // https://github.com/webpack/react-starter/issues/3
            console: true,
            net: "empty",
            tls: "empty",
            fs: "empty"
        }
    };

} else {

    webpackConfig = {

        entry: './assets/react/indexView.jsx',

        output: {
          path: path.join(__dirname, '.tmp/public'),
          filename: 'bundle.js',
        },
        plugins: [
            new webpack.optimize.UglifyJsPlugin({
                compress: {
                  warnings: false,
                  sequences: true,
                  dead_code: true,
                  conditionals: true,
                  booleans: true,
                  unused: true,
                  if_return: true,
                  join_vars: true,
                  drop_console: true,
                  screw_ie8: true,
                },
            }),
            new webpack.optimize.DedupePlugin(),
        ],
        resolve: {
          extensions: ['', '.js', '.jsx']
        },
        module: {
          loaders: [{
            test: /\.jsx?$|react\.js/,
            loader: 'babel',
            //loader: 'babel?optional[]=runtime', /* npm install babel-runtime --save */
            include: path.join(__dirname, 'assets'),
            exclude: /sails\.io\.js$|node_modules$|\w+\.geo\.js/
          }]
        }
    };
}


module.exports = webpackConfig;
