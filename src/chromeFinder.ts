import * as fs from 'fs';
import * as path from 'path';
import { execFileSync } from 'child_process';

export type SupportedBrowser = 'chrome' | 'edge' | 'brave' | 'chromium';
export type BrowserDetectionSource = 'configured' | 'well-known-path' | 'command';

export interface BrowserCandidate {
  browser: SupportedBrowser;
  browserName: string;
  source: BrowserDetectionSource;
  location: string;
  executablePath: string | null;
  detected: boolean;
}

export interface BrowserResolution {
  executablePath: string | null;
  browser: SupportedBrowser | null;
  browserName: string | null;
  source: BrowserDetectionSource | null;
  configuredPath: string | null;
  diagnostics: BrowserCandidate[];
}

interface BrowserTarget {
  browser: SupportedBrowser;
  browserName: string;
  path?: string;
  command?: string;
}

const WINDOWS_PATHS: BrowserTarget[] = [
  {
    browser: 'chrome',
    browserName: 'Google Chrome',
    path: path.join(process.env['PROGRAMFILES'] || 'C:\\Program Files', 'Google', 'Chrome', 'Application', 'chrome.exe'),
  },
  {
    browser: 'chrome',
    browserName: 'Google Chrome',
    path: path.join(process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)', 'Google', 'Chrome', 'Application', 'chrome.exe'),
  },
  {
    browser: 'chrome',
    browserName: 'Google Chrome',
    path: path.join(process.env['LOCALAPPDATA'] || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
  },
  {
    browser: 'edge',
    browserName: 'Microsoft Edge',
    path: path.join(process.env['PROGRAMFILES'] || 'C:\\Program Files', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
  },
  {
    browser: 'edge',
    browserName: 'Microsoft Edge',
    path: path.join(process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
  },
  {
    browser: 'brave',
    browserName: 'Brave',
    path: path.join(process.env['PROGRAMFILES'] || 'C:\\Program Files', 'BraveSoftware', 'Brave-Browser', 'Application', 'brave.exe'),
  },
  {
    browser: 'brave',
    browserName: 'Brave',
    path: path.join(process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)', 'BraveSoftware', 'Brave-Browser', 'Application', 'brave.exe'),
  },
  {
    browser: 'brave',
    browserName: 'Brave',
    path: path.join(process.env['LOCALAPPDATA'] || '', 'BraveSoftware', 'Brave-Browser', 'Application', 'brave.exe'),
  },
];

const MAC_PATHS: BrowserTarget[] = [
  {
    browser: 'chrome',
    browserName: 'Google Chrome',
    path: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  },
  {
    browser: 'edge',
    browserName: 'Microsoft Edge',
    path: '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  },
  {
    browser: 'brave',
    browserName: 'Brave',
    path: '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
  },
];

const LINUX_COMMANDS: BrowserTarget[] = [
  {
    browser: 'chrome',
    browserName: 'Google Chrome',
    command: 'google-chrome',
  },
  {
    browser: 'chrome',
    browserName: 'Google Chrome',
    command: 'google-chrome-stable',
  },
  {
    browser: 'chromium',
    browserName: 'Chromium',
    command: 'chromium-browser',
  },
  {
    browser: 'chromium',
    browserName: 'Chromium',
    command: 'chromium',
  },
  {
    browser: 'edge',
    browserName: 'Microsoft Edge',
    command: 'microsoft-edge',
  },
  {
    browser: 'edge',
    browserName: 'Microsoft Edge',
    command: 'microsoft-edge-stable',
  },
  {
    browser: 'brave',
    browserName: 'Brave',
    command: 'brave-browser',
  },
  {
    browser: 'brave',
    browserName: 'Brave',
    command: 'brave',
  },
];

function fileExists(filePath: string): boolean {
  try {
    return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
}

function resolveCommand(command: string): string | null {
  try {
    const lookupCommand = process.platform === 'win32' ? 'where.exe' : 'which';
    const result = execFileSync(lookupCommand, [command], {
      encoding: 'utf-8',
      timeout: 5000,
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    const resolved = result
      .split(/\r?\n/)
      .map(line => line.trim())
      .find(line => line.length > 0);

    return resolved || null;
  } catch {
    return null;
  }
}

function detectFromPath(target: BrowserTarget): BrowserCandidate {
  const executablePath = target.path && fileExists(target.path) ? target.path : null;
  return {
    browser: target.browser,
    browserName: target.browserName,
    source: 'well-known-path',
    location: target.path || '',
    executablePath,
    detected: executablePath !== null,
  };
}

function detectFromCommand(target: BrowserTarget): BrowserCandidate {
  const resolvedPath = target.command ? resolveCommand(target.command) : null;
  const executablePath = resolvedPath && fileExists(resolvedPath) ? resolvedPath : null;

  return {
    browser: target.browser,
    browserName: target.browserName,
    source: 'command',
    location: target.command || '',
    executablePath,
    detected: executablePath !== null,
  };
}

function detectConfiguredPath(configuredPath: string): BrowserCandidate {
  const executablePath = fileExists(configuredPath) ? configuredPath : null;

  return {
    browser: inferBrowserFromPath(configuredPath),
    browserName: inferBrowserName(configuredPath),
    source: 'configured',
    location: configuredPath,
    executablePath,
    detected: executablePath !== null,
  };
}

function inferBrowserFromPath(candidatePath: string): SupportedBrowser {
  const normalized = candidatePath.toLowerCase();
  if (normalized.includes('brave')) {
    return 'brave';
  }
  if (normalized.includes('edge') || normalized.includes('msedge')) {
    return 'edge';
  }
  if (normalized.includes('chromium')) {
    return 'chromium';
  }
  return 'chrome';
}

function inferBrowserName(candidatePath: string): string {
  switch (inferBrowserFromPath(candidatePath)) {
    case 'brave':
      return 'Brave';
    case 'edge':
      return 'Microsoft Edge';
    case 'chromium':
      return 'Chromium';
    default:
      return 'Google Chrome';
  }
}

function getPlatformTargets(): BrowserTarget[] {
  if (process.platform === 'win32') {
    return WINDOWS_PATHS;
  }
  if (process.platform === 'darwin') {
    return MAC_PATHS;
  }
  return LINUX_COMMANDS;
}

export function resolveBrowserExecutable(configuredPath?: string | null): BrowserResolution {
  const trimmedConfiguredPath = configuredPath?.trim() || null;
  const diagnostics: BrowserCandidate[] = [];

  if (trimmedConfiguredPath) {
    const configuredCandidate = detectConfiguredPath(trimmedConfiguredPath);
    diagnostics.push(configuredCandidate);

    if (configuredCandidate.detected && configuredCandidate.executablePath) {
      return {
        executablePath: configuredCandidate.executablePath,
        browser: configuredCandidate.browser,
        browserName: configuredCandidate.browserName,
        source: configuredCandidate.source,
        configuredPath: trimmedConfiguredPath,
        diagnostics,
      };
    }
  }

  for (const target of getPlatformTargets()) {
    const candidate = target.path ? detectFromPath(target) : detectFromCommand(target);
    diagnostics.push(candidate);

    if (candidate.detected && candidate.executablePath) {
      return {
        executablePath: candidate.executablePath,
        browser: candidate.browser,
        browserName: candidate.browserName,
        source: candidate.source,
        configuredPath: trimmedConfiguredPath,
        diagnostics,
      };
    }
  }

  return {
    executablePath: null,
    browser: null,
    browserName: null,
    source: null,
    configuredPath: trimmedConfiguredPath,
    diagnostics,
  };
}

export function findChrome(): string | null {
  return resolveBrowserExecutable().executablePath;
}
