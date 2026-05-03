import type { BrowserCandidate, BrowserResolution, SupportedBrowser } from './chromeFinder';

export interface LaunchCandidate {
  browser: SupportedBrowser;
  browserName: string;
  executablePath: string;
}

function isLaunchableCandidate(candidate: BrowserCandidate): candidate is BrowserCandidate & { executablePath: string } {
  return candidate.detected && typeof candidate.executablePath === 'string' && candidate.executablePath.length > 0;
}

export function getLaunchCandidates(resolution: BrowserResolution): LaunchCandidate[] {
  const candidates: LaunchCandidate[] = [];
  const seenPaths = new Set<string>();

  const pushCandidate = (candidate: LaunchCandidate | null) => {
    if (!candidate || seenPaths.has(candidate.executablePath)) {
      return;
    }

    seenPaths.add(candidate.executablePath);
    candidates.push(candidate);
  };

  if (resolution.executablePath && resolution.browser && resolution.browserName) {
    pushCandidate({
      browser: resolution.browser,
      browserName: resolution.browserName,
      executablePath: resolution.executablePath,
    });
  }

  for (const diagnostic of resolution.diagnostics) {
    if (!isLaunchableCandidate(diagnostic)) {
      continue;
    }

    pushCandidate({
      browser: diagnostic.browser,
      browserName: diagnostic.browserName,
      executablePath: diagnostic.executablePath,
    });
  }

  return candidates;
}

export async function launchBrowserWithFallback<T>(
  candidates: LaunchCandidate[],
  launch: (candidate: LaunchCandidate) => Promise<T>
): Promise<T> {
  const failures: string[] = [];

  for (const candidate of candidates) {
    try {
      return await launch(candidate);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failures.push(`${candidate.browserName} (${candidate.executablePath}): ${message}`);
    }
  }

  throw new Error(`Unable to launch any supported browser. Tried: ${failures.join(' | ')}`);
}
