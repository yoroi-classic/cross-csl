const path = require('path')
const os = require('os')
const fs = require('fs')

const webpackConfig = require('./webpack.dev.config')

const packageDir = 'node_modules/@emurgo/cardano-serialization-lib-browser'
const chromeCandidates = [
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium-browser',
  '/usr/bin/chromium'
]

if (!process.env.CHROME_BIN) {
  const chromeBin = chromeCandidates.find((candidate) =>
    fs.existsSync(candidate)
  )
  if (chromeBin) {
    process.env.CHROME_BIN = chromeBin
  }
}

/*
  It seems Karma is currently unable to serve WASM files,
    and will return a 404 when such files are requested.
  This snippet uses the same expression as in karma-webpack and then we use this path to
    determine the location of the WASM file included in the bundle.

  If at some point `karma-webpack` changes to add all its output files to `files` automatically,
    we can probably get rid of this hack.
*/
// https://github.com/ryanclark/karma-webpack/issues/498#issuecomment-790040818
// https://github.com/ryanclark/karma-webpack/issues/498#issuecomment-846613710
const output = {
  path: path.join(os.tmpdir(), '_karma_webpack_') + Math.floor(Math.random() * 1000000),
}

module.exports = function(config) {
  config.set({
    basePath: '',

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['mocha', 'webpack'],

    mime: {
      'application/wasm': ['wasm']
    },

    // list of files / patterns to load in the browser
    files: [
      'spec/**/*.ts',
      'src/**/*.ts',
      // This next line will throw a warning saying `Pattern "/.../*.wasm" does not match any file`
      { pattern: `${output.path}/**/*`, watched: false, included: false, },
    ],

    // list of files / patterns to exclude
    exclude: [ ],

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      '**/*.ts': ['webpack', 'sourcemap']
    },

    // config pulled from webpack
    webpack: {...webpackConfig, output},

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['spec'],

    // web server port
    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,

    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['ChromeHeadless'],

    customLaunchers: {
      ChromeHeadlessCI: {
        base: 'ChromeHeadless',
        flags: [
          '--no-sandbox',
          '--disable-dev-shm-usage',
          '--disable-features=Vulkan',
          '--disable-gpu'
        ]
      }
    },

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity,
  })
}
