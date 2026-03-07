import * as vscode from 'vscode';
import * as path from 'path';
import { convertMarkdownToPdf } from './converter';

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

  context.subscriptions.push(saveListener, command);
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
