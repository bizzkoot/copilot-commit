import * as vscode from 'vscode';

let outputChannel: vscode.OutputChannel | undefined;

export function initLogger(): vscode.Disposable {
  outputChannel = vscode.window.createOutputChannel('Copilot Commit');
  return outputChannel;
}

export function log(message: string): void {
  outputChannel?.appendLine(`[${new Date().toISOString()}] ${message}`);
}

export function logError(message: string, error?: unknown): void {
  const errorMsg = error instanceof Error ? error.message : String(error);
  outputChannel?.appendLine(
    `[${new Date().toISOString()}] ERROR: ${message}${error ? ` - ${errorMsg}` : ''}`,
  );
}
