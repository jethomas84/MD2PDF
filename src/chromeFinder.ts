import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const WINDOWS_PATHS = [
  path.join(process.env['PROGRAMFILES'] || 'C:\\Program Files', 'Google', 'Chrome', 'Application', 'chrome.exe'),
  path.join(process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)', 'Google', 'Chrome', 'Application', 'chrome.exe'),
  path.join(process.env['LOCALAPPDATA'] || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
  path.join(process.env['PROGRAMFILES'] || 'C:\\Program Files', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
  path.join(process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
];

const MAC_PATHS = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
];

const LINUX_COMMANDS = [
  'google-chrome',
  'google-chrome-stable',
  'chromium-browser',
  'chromium',
  'microsoft-edge',
];

function fileExists(p: string): boolean {
  try {
    return fs.existsSync(p) && fs.statSync(p).isFile();
  } catch {
    return false;
  }
}

function whichCommand(cmd: string): string | null {
  try {
    const result = execSync(`which ${cmd} 2>/dev/null || where ${cmd} 2>NUL`, {
      encoding: 'utf-8',
      timeout: 5000,
    }).trim();
    return result.split('\n')[0] || null;
  } catch {
    return null;
  }
}

export function findChrome(): string | null {
  const platform = process.platform;

  if (platform === 'win32') {
    for (const p of WINDOWS_PATHS) {
      if (fileExists(p)) {
        return p;
      }
    }
  } else if (platform === 'darwin') {
    for (const p of MAC_PATHS) {
      if (fileExists(p)) {
        return p;
      }
    }
  } else {
    // Linux
    for (const cmd of LINUX_COMMANDS) {
      const resolved = whichCommand(cmd);
      if (resolved && fileExists(resolved)) {
        return resolved;
      }
    }
  }

  return null;
}
