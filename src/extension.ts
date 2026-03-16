import * as vscode from 'vscode';
import { GitService } from './services/gitService';
import { CopilotService } from './services/copilotService';
import { ModelManager } from './services/modelManager';
import { initLogger, log, logError } from './services/logger';
import { getAllStyles, getStyleById, CommitStyle } from './templates/styles';

let gitService: GitService;
let copilotService: CopilotService;
let modelManager: ModelManager;

export async function activate(
  context: vscode.ExtensionContext,
): Promise<void> {
  try {
    // Initialize logger first to catch all errors
    const outputChannel = initLogger();
    log('Copilot Commit activated');
    
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || 'unknown';
    log(`Workspace: ${workspaceFolder}`);

    // Initialize services with error handling
    try {
      gitService = new GitService();
      context.subscriptions.push(gitService);
      log('GitService created');
    } catch (error) {
      logError('Failed to create GitService', error);
      throw error;
    }

    try {
      modelManager = new ModelManager(context);
      context.subscriptions.push(modelManager);
      log('ModelManager created');
    } catch (error) {
      logError('Failed to create ModelManager', error);
      vscode.window.showWarningMessage(
        'Copilot Commit: Status bar unavailable, but extension will still work.'
      );
      // Continue without status bar - create a safe fallback
      modelManager = null as unknown as ModelManager;
    }

    try {
      copilotService = new CopilotService(modelManager);
      log('CopilotService created');
    } catch (error) {
      logError('Failed to create CopilotService', error);
      throw error;
    }

    // Try to initialize git eagerly (non-blocking, no error if fails)
    gitService.initialize().catch((err) => {
      logError('Git initialization failed (will retry on demand)', err);
    });

    // Register commands (always — git check happens inside handlers)
    context.subscriptions.push(
      vscode.commands.registerCommand(
        'copilotCommit.generateCommitMessage',
        handleGenerateCommitMessage,
      ),
    );

    context.subscriptions.push(
      vscode.commands.registerCommand(
        'copilotCommit.selectModel',
        () => modelManager?.showModelPicker(),
      ),
    );

    context.subscriptions.push(
      vscode.commands.registerCommand(
        'copilotCommit.selectStyle',
        handleSelectStyle,
      ),
    );

    context.subscriptions.push(outputChannel);
    
    log('Copilot Commit fully initialized successfully');
  } catch (error) {
    // Critical failure - show user and log
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('Copilot Commit activation failed:', errorMsg);
    
    // Try to show to user (might fail if VS Code not fully ready)
    try {
      vscode.window.showErrorMessage(
        `Copilot Commit failed to initialize: ${errorMsg}`
      );
    } catch {
      // VS Code UI not ready yet
    }
    
    // Still throw to let VS Code know activation failed
    throw error;
  }
}

async function handleGenerateCommitMessage(): Promise<void> {
  // Ensure git is initialized
  const gitReady = await gitService.initialize();
  if (!gitReady) {
    return;
  }

  // Get staged diff
  const diff = await gitService.getStagedDiff();
  if (!diff) {
    return;
  }

  // Get current style
  const config = vscode.workspace.getConfiguration('copilotCommit');
  const styleId = config.get<string>('defaultStyle', 'conventional');
  const style = getStyleById(styleId) || getAllStyles()[0];

  // Show progress
  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: `Copilot Commit: Generating with ${style.name}...`,
      cancellable: true,
    },
    async (_progress, token) => {
      if (token.isCancellationRequested) {
        return;
      }

      const message = await copilotService.generateCommitMessage(
        diff,
        style.prompt,
        token,
      );

      if (message && !token.isCancellationRequested) {
        const success = gitService.setCommitMessage(message);
        if (success) {
          vscode.window.showInformationMessage(
            'Copilot Commit: Message generated successfully!',
          );
          // Focus the Source Control view
          vscode.commands.executeCommand('workbench.view.scm');
        }
      }
    },
  );
}

interface StylePickItem extends vscode.QuickPickItem {
  styleId?: string;
  action?: 'settings' | 'model';
}

async function handleSelectStyle(): Promise<void> {
  const styles = getAllStyles();

  const config = vscode.workspace.getConfiguration('copilotCommit');
  const currentStyleId = config.get<string>('defaultStyle', 'conventional');

  const items: StylePickItem[] = styles.map((s: CommitStyle) => ({
    label: `${s.id === currentStyleId ? '$(check) ' : ''}${s.name}`,
    description: s.id.startsWith('custom-') ? 'Custom' : 'Built-in',
    detail: s.description,
    styleId: s.id,
  }));

  // Add separator and utility options
  items.push(
    { label: '', kind: vscode.QuickPickItemKind.Separator } as StylePickItem,
    {
      label: '$(sparkle) Change Model',
      description: 'Switch the AI model used for generation',
      action: 'model',
    } as StylePickItem,
    {
      label: '$(gear) Open Copilot Commit Settings',
      description: 'Configure all extension options',
      action: 'settings',
    } as StylePickItem,
  );

  const selected = await vscode.window.showQuickPick(items, {
    title: 'Copilot Commit: Select Commit Style',
    placeHolder: 'Choose a commit message style',
  });

  if (selected) {
    if (selected.action === 'settings') {
      vscode.commands.executeCommand(
        'workbench.action.openSettings',
        'copilotCommit',
      );
      return;
    }
    if (selected.action === 'model') {
      vscode.commands.executeCommand('copilotCommit.selectModel');
      return;
    }
    if (selected.styleId) {
      await config.update('defaultStyle', selected.styleId, true);
      const style = styles.find(
        (s: CommitStyle) => s.id === selected.styleId,
      );
      if (style) {
        vscode.window.showInformationMessage(
          `Copilot Commit: Style set to "${style.name}"`,
        );
      }
    }
  }
}

export function deactivate(): void {
  gitService = undefined!;
  copilotService = undefined!;
  modelManager = undefined!;
}
