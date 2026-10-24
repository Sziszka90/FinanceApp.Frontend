const path = require('node:path');

module.exports = config => {
  config.set({
    frameworks: ['jasmine'],
    reporters: ['progress', 'kjhtml'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage')
    ],
    jasmineHtmlReporter: {
      suppressAll: true
    },
    coverageReporter: {
      dir: path.join(__dirname, 'coverage', 'financeapp.frontend'),
      subdir: '.',
      reporters: [{ type: 'html' }, { type: 'text-summary' }, { type: 'lcovonly' }]
    }
  });
};
