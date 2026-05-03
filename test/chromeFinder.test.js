const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildBrowserResolution,
} = require('../out/chromeFinder.js');

test('buildBrowserResolution preserves all detected candidates in diagnostics', () => {
  const diagnostics = [
    {
      browser: 'edge',
      browserName: 'Microsoft Edge',
      source: 'well-known-path',
      location: 'C:\\Edge\\msedge.exe',
      executablePath: 'C:\\Edge\\msedge.exe',
      detected: true,
    },
    {
      browser: 'chrome',
      browserName: 'Google Chrome',
      source: 'well-known-path',
      location: 'C:\\Chrome\\chrome.exe',
      executablePath: 'C:\\Chrome\\chrome.exe',
      detected: true,
    },
  ];

  const resolution = buildBrowserResolution(null, diagnostics);

  assert.equal(resolution.executablePath, 'C:\\Edge\\msedge.exe');
  assert.equal(resolution.diagnostics.length, 2);
  assert.equal(resolution.diagnostics[1].executablePath, 'C:\\Chrome\\chrome.exe');
});
