import * as vscode from 'vscode';
import { log, logError } from './logger';

interface GitExtensionAPI {
  getAPI(version: number): GitAPI;
}

interface GitAPI {
  repositories: Repository[];
}

interface Repository {
  rootUri: vscode.Uri;
  inputBox: { value: string };
  diff(cached?: boolean): Promise<string>;
  state: {
    indexChanges: Array<{ uri: vscode.Uri }>;
    workingTreeChanges: Array<{ uri: vscode.Uri }>;
  };
}

export class GitService implements vscode.Disposable {
  private gitApi: GitAPI | undefined;

  async initialize(): Promise<boolean> {
    if (this.gitApi) {
      return true;
    }
    
    const gitExtension =
      vscode.extensions.getExtension<GitExtensionAPI>('vscode.git');
    if (!gitExtension) {
      logError('Git extension not found');
      vscode.window.showErrorMessage(
        'Copilot Commit: Git extension not found. Please install the Git extension.',
      );
      return false;
    }

    try {
      // Add timeout for activation to prevent hanging during concurrent startup
      const activationPromise = gitExtension.activate();
      const timeoutPromise = new Promise<boolean>((_, reject) => 
        setTimeout(() => reject(new Error('Git extension activation timeout')), 5000)
      );
      
      await Promise.race([activationPromise, timeoutPromise]);
      
      this.gitApi = gitExtension.exports.getAPI(1);
      log('Git API initialized successfully');
      return true;
    } catch (error) {
      logError('Failed to initialize Git API', error);
      vscode.window.showWarningMessage(
        'Copilot Commit: Git extension not ready. Retrying on demand.',
      );
      return false;
    }
  }

  getRepository(): Repository | undefined {
    if (!this.gitApi || this.gitApi.repositories.length === 0) {
      return undefined;
    }

    // Use the first repository, or find the one matching the active editor
    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor && this.gitApi.repositories.length > 1) {
      const activeUri = activeEditor.document.uri;
      return (
        this.gitApi.repositories.find((repo) => {
          const repoPath = repo.rootUri.fsPath.toLowerCase();
          const activePath = activeUri.fsPath.toLowerCase();
          return activePath.startsWith(repoPath);
        }) || this.gitApi.repositories[0]
      );
    }

    return this.gitApi.repositories[0];
  }

  async getStagedDiff(): Promise<string | undefined> {
    const repo = this.getRepository();
    if (!repo) {
      vscode.window.showWarningMessage(
        'Copilot Commit: No Git repository found.',
      );
      return undefined;
    }

    // Check if there are staged changes
    if (repo.state.indexChanges.length === 0) {
      vscode.window.showWarningMessage(
        'Copilot Commit: No staged changes found. Please stage your changes first.',
      );
      return undefined;
    }

    // Get the cached (staged) diff
    try {
      const diff = await repo.diff(true);

      if (!diff || diff.trim().length === 0) {
        vscode.window.showWarningMessage(
          'Copilot Commit: Staged diff is empty.',
        );
        return undefined;
      }

      // Validate diff content
      const MAX_DIFF_SIZE = 10 * 1024 * 1024; // 10 MB
      if (diff.length > MAX_DIFF_SIZE) {
        vscode.window.showWarningMessage(
          'Copilot Commit: Diff is too large (>10 MB). Please stage fewer changes.',
        );
        return undefined;
      }

      // Detect binary content (NUL bytes)
      if (diff.includes('\0')) {
        vscode.window.showWarningMessage(
          'Copilot Commit: Diff contains binary content. Please stage only text files.',
        );
        return undefined;
      }

      return diff;
    } catch (error) {
      logError('Failed to read staged diff', error);
      vscode.window.showErrorMessage(
        `Copilot Commit: Failed to read staged diff. ${error instanceof Error ? error.message : ''}`,
      );
      return undefined;
    }
  }

  setCommitMessage(message: string): boolean {
    const repo = this.getRepository();
    if (!repo) {
      return false;
    }

    repo.inputBox.value = this.sanitizeCommitMessage(message);
    return true;
  }

  private sanitizeCommitMessage(message: string): string {
    // Remove null bytes and control characters (keep newlines/tabs)
    let sanitized = message.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    // Enforce max length (10,000 chars is generous for any commit message)
    const MAX_COMMIT_LENGTH = 10000;
    if (sanitized.length > MAX_COMMIT_LENGTH) {
      sanitized = sanitized.substring(0, MAX_COMMIT_LENGTH);
    }
    return sanitized.trim();
  }

  hasStagedChanges(): boolean {
    const repo = this.getRepository();
    return repo ? repo.state.indexChanges.length > 0 : false;
  }

  dispose(): void {
    this.gitApi = undefined;
  }
}
