const test = require('node:test');
const assert = require('node:assert/strict');

const {
  launchBrowserWithFallback,
} = require('../out/browserLauncher.js');

test('launchBrowserWithFallback retries later candidates when the first launch fails', async () => {
  const attempts = [];
  const candidates = [
    {
      browser: 'edge',
      browserName: 'Microsoft Edge',
      executablePath: 'C:\\Edge\\msedge.exe',
    },
    {
      browser: 'chrome',
      browserName: 'Google Chrome',
      executablePath: 'C:\\Chrome\\chrome.exe',
    },
  ];

  const launched = await launchBrowserWithFallback(candidates, async (candidate) => {
    attempts.push(candidate.executablePath);
    if (candidate.browser === 'edge') {
      throw new Error('edge failed');
    }

    return { browser: candidate.browser };
  });

  assert.deepEqual(attempts, [
    'C:\\Edge\\msedge.exe',
    'C:\\Chrome\\chrome.exe',
  ]);
  assert.deepEqual(launched, {
    browser: 'chrome',
  });
});
