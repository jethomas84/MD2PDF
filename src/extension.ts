import * as vscode from 'vscode';
import * as path from 'path';
import puppeteer from 'puppeteer-core';
import { convertMarkdownToPdf } from './converter';
import { resolveBrowserExecutable } from './chromeFinder';
import { getLaunchCandidates, launchBrowserWithFallback } from './browserLauncher';

let statusBarItem: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext) {
  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 0);
  context.subscriptions.push(statusBarItem);

  // Auto-convert on save
  const saveListener = vscode.workspace.onDidSaveTextDocument(async (document) => {
    const config = vscode.workspace.getConfiguration('md2pdf');
    if (!config.get<boolean>('enabled')) {
      return;
    }

    if (document.languageId !== 'markdown') {
      return;
    }

    await runConversion(document.uri.fsPath);
  });

  // Manual command
  const command = vscode.commands.registerCommand('md2pdf.convertCurrentFile', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage('MD2PDF: No active editor.');
      return;
    }
    if (editor.document.languageId !== 'markdown') {
      vscode.window.showWarningMessage('MD2PDF: Current file is not a Markdown file.');
      return;
    }

    await runConversion(editor.document.uri.fsPath);
  });

  const checkBrowserSetupCommand = vscode.commands.registerCommand('md2pdf.checkBrowserSetup', async () => {
    const config = vscode.workspace.getConfiguration('md2pdf');
    const configuredPath = config.get<string>('chromePath');
    const resolution = resolveBrowserExecutable(configuredPath);
    const launchCandidates = getLaunchCandidates(resolution);

    if (launchCandidates.length === 0) {
      const configuredPathMessage = resolution.configuredPath
        ? ` The current md2pdf.chromePath setting was not found: ${resolution.configuredPath}.`
        : '';

      vscode.window.showWarningMessage(
        'MD2PDF: No supported browser was found. Install Chrome, Edge, or Brave, or set "md2pdf.chromePath" in Settings.'
        + configuredPathMessage
      );
      return;
    }

    try {
      let launchedCandidatePath = '';
      let launchedCandidateName = 'a supported browser';
      const browser = await launchBrowserWithFallback(launchCandidates, async (candidate) => {
        launchedCandidatePath = candidate.executablePath;
        launchedCandidateName = candidate.browserName;
        return puppeteer.launch({
          executablePath: candidate.executablePath,
          headless: true,
          args: process.platform === 'linux'
            ? ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
            : [],
        });
      });
      await browser.close();

      vscode.window.showInformationMessage(
        `MD2PDF: Ready to use ${launchedCandidateName} at ${launchedCandidatePath}`
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      vscode.window.showWarningMessage(`MD2PDF: Browser detection succeeded, but launch failed. ${message}`);
    }
  });

  context.subscriptions.push(saveListener, command, checkBrowserSetupCommand);
}

async function runConversion(filePath: string) {
  const fileName = path.basename(filePath);
  statusBarItem.text = `$(sync~spin) MD2PDF: Converting ${fileName}...`;
  statusBarItem.show();

  try {
    const outputPath = await convertMarkdownToPdf(filePath);
    const outputName = path.basename(outputPath);
    statusBarItem.text = `$(check) MD2PDF: ${outputName}`;
    vscode.window.showInformationMessage(`MD2PDF: Created ${outputName}`);

    // Hide status after 5 seconds
    setTimeout(() => {
      statusBarItem.hide();
    }, 5000);
  } catch (err: any) {
    statusBarItem.text = `$(error) MD2PDF: Failed`;
    vscode.window.showErrorMessage(`MD2PDF: ${err.message}`);

    setTimeout(() => {
      statusBarItem.hide();
    }, 8000);
  }
}

export function deactivate() {}
