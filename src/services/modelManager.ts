import * as vscode from 'vscode';

export interface ModelInfo {
  id: string;
  name: string;
  family: string;
  vendor: string;
  version: string;
  maxInputTokens: number;
}

interface ModelPickItem extends vscode.QuickPickItem {
  modelId?: string;
  action?: 'settings' | 'style';
}

export class ModelManager {
  private currentModelId: string | undefined;
  private statusBarItem: vscode.StatusBarItem;
  private disposables: vscode.Disposable[] = [];
  private context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.currentModelId = context.globalState.get<string>('selectedModelId');

    try {
      this.statusBarItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Right,
        90,
      );
      
      // Validate status bar was created
      if (!this.statusBarItem) {
        throw new Error('Failed to create status bar item');
      }

      this.statusBarItem.command = 'copilotCommit.selectModel';
      this.updateStatusBarTooltip();
      this.updateStatusBar();
      this.statusBarItem.show();
      
    } catch (error) {
      // Log but don't throw - extension can work without status bar
      console.error('ModelManager: Status bar creation failed:', error);
      
      // Create a dummy status bar to prevent null checks elsewhere
      this.statusBarItem = {
        text: '',
        tooltip: '',
        command: '',
        show: () => {},
        hide: () => {},
        dispose: () => {},
      } as unknown as vscode.StatusBarItem;
    }

    // Listen for model changes
    try {
      this.disposables.push(
        vscode.lm.onDidChangeChatModels(() => {
          this.updateStatusBar().catch((err) => {
            console.error('Failed to update status bar on model change:', err);
          });
        }),
      );
    } catch (error) {
      console.error('ModelManager: Failed to listen for model changes:', error);
    }

    // Listen for config changes
    try {
      this.disposables.push(
        vscode.workspace.onDidChangeConfiguration((e) => {
          if (e.affectsConfiguration('copilotCommit')) {
            this.updateStatusBar().catch((err) => {
              console.error('Failed to update status bar on config change:', err);
            });
            this.updateStatusBarTooltip();
          }
        }),
      );
    } catch (error) {
      console.error('ModelManager: Failed to listen for config changes:', error);
    }
  }

  async getAvailableModels(): Promise<ModelInfo[]> {
    try {
      const models = await vscode.lm.selectChatModels();
      return models.map((m) => ({
        id: m.id,
        name: m.name,
        family: m.family,
        vendor: m.vendor,
        version: m.version,
        maxInputTokens: m.maxInputTokens,
      }));
    } catch {
      return [];
    }
  }

  private modelSelectionPromise: Promise<vscode.LanguageModelChat | undefined> | undefined;

  async selectModel(): Promise<vscode.LanguageModelChat | undefined> {
    // Prevent concurrent model selection calls
    if (this.modelSelectionPromise) {
      return this.modelSelectionPromise;
    }
    this.modelSelectionPromise = this.doSelectModel();
    try {
      return await this.modelSelectionPromise;
    } finally {
      this.modelSelectionPromise = undefined;
    }
  }

  private async doSelectModel(): Promise<vscode.LanguageModelChat | undefined> {
    const config = vscode.workspace.getConfiguration('copilotCommit');
    const useCurrentChat = config.get<boolean>('useCurrentChatModel', true);

    // If user wants to use current Copilot Chat model, try auto-detect
    if (useCurrentChat && !this.currentModelId) {
      const models = await vscode.lm.selectChatModels({ vendor: 'copilot' });
      if (models.length > 0) {
        return models[0];
      }
    }

    // If a specific model is selected (via status bar or settings)
    if (this.currentModelId) {
      const models = await vscode.lm.selectChatModels({
        id: this.currentModelId,
      });
      if (models.length > 0) {
        return models[0];
      }
    }

    // Fallback: use defaultModel from settings
    const defaultModel = config.get<string>('defaultModel', 'auto');
    if (defaultModel !== 'auto') {
      const models = await vscode.lm.selectChatModels({ family: defaultModel });
      if (models.length > 0) {
        return models[0];
      }
    }

    // Final fallback: first available model
    const allModels = await vscode.lm.selectChatModels();
    if (allModels.length > 0) {
      return allModels[0];
    }

    vscode.window.showErrorMessage(
      'Copilot Commit: No language models available. Make sure GitHub Copilot is active.',
    );
    return undefined;
  }

  async showModelPicker(): Promise<void> {
    const models = await this.getAvailableModels();

    if (models.length === 0) {
      vscode.window.showWarningMessage(
        'Copilot Commit: No models available. Ensure Copilot is active.',
      );
      return;
    }

    const items: ModelPickItem[] = models.map((m) => ({
      label: m.name || m.family,
      description: `${m.vendor} · ${m.family}${m.version ? ` v${m.version}` : ''}`,
      detail: `Max tokens: ${m.maxInputTokens.toLocaleString()}${this.currentModelId === m.id ? ' $(check) Current' : ''}`,
      modelId: m.id,
    }));

    // Add "Auto" option at the top
    items.unshift({
      label: '$(sparkle) Auto (Use Copilot Chat model)',
      description: 'Automatically use current Copilot Chat model',
      detail: !this.currentModelId ? '$(check) Current' : undefined,
      modelId: undefined,
    });

    // Add separator and utility options
    items.push(
      { label: '', kind: vscode.QuickPickItemKind.Separator } as ModelPickItem,
      {
        label: '$(symbol-keyword) Change Commit Style',
        description: 'Switch between commit message formats',
        action: 'style',
      } as ModelPickItem,
      {
        label: '$(gear) Open Copilot Commit Settings',
        description: 'Configure all extension options',
        action: 'settings',
      } as ModelPickItem,
    );

    const selected = await vscode.window.showQuickPick(items, {
      title: 'Copilot Commit: Select Model',
      placeHolder: 'Choose a model for commit message generation',
    });

    if (selected) {
      if (selected.action === 'settings') {
        vscode.commands.executeCommand(
          'workbench.action.openSettings',
          'copilotCommit',
        );
        return;
      }
      if (selected.action === 'style') {
        vscode.commands.executeCommand('copilotCommit.selectStyle');
        return;
      }
      if (selected.modelId === undefined) {
        this.currentModelId = undefined;
        this.context.globalState.update('selectedModelId', undefined);
        const config = vscode.workspace.getConfiguration('copilotCommit');
        await config.update('useCurrentChatModel', true, true);
      } else {
        this.currentModelId = selected.modelId;
        this.context.globalState.update('selectedModelId', selected.modelId);
        const config = vscode.workspace.getConfiguration('copilotCommit');
        await config.update('useCurrentChatModel', false, true);
      }
      this.updateStatusBar();
    }
  }

  private async updateStatusBar(): Promise<void> {
    try {
      const config = vscode.workspace.getConfiguration('copilotCommit');
      const showInStatusBar = config.get<boolean>('showModelInStatusBar', true);

      if (!showInStatusBar) {
        this.statusBarItem?.hide();
        return;
      }

      if (this.currentModelId) {
        try {
          const models = await vscode.lm.selectChatModels({
            id: this.currentModelId,
          });
          
          if (models.length > 0) {
            this.statusBarItem.text = `$(hubot) ${models[0].name || models[0].family}`;
          } else {
            this.statusBarItem.text = '$(hubot) Model N/A';
            this.currentModelId = undefined;
          }
        } catch (modelError) {
          console.error('ModelManager: Failed to fetch models:', modelError);
          this.statusBarItem.text = '$(hubot) Auto';
        }
      } else {
        this.statusBarItem.text = '$(hubot) Auto';
      }

      this.statusBarItem?.show();
    } catch (error) {
      console.error('ModelManager: updateStatusBar failed:', error);
    }
  }

  private updateStatusBarTooltip(): void {
    const config = vscode.workspace.getConfiguration('copilotCommit');
    const styleId = config.get<string>('defaultStyle', 'conventional');
    const styleLabels: Record<string, string> = {
      conventional: 'Conventional Commits',
      simple: 'Simple Descriptive',
      oneline: 'One-Line Summary',
      github: 'GitHub-Style',
      emoji: 'Semantic Emoji',
      detailed: 'Detailed/Verbose',
      gitmoji: 'Gitmoji',
      angular: 'Angular Style',
    };
    const styleName = styleLabels[styleId] || styleId;
    this.statusBarItem.tooltip = `Copilot Commit\nStyle: ${styleName}\nClick to change model or settings`;
  }

  getCurrentModelId(): string | undefined {
    return this.currentModelId;
  }

  dispose(): void {
    this.statusBarItem.dispose();
    this.disposables.forEach((d) => d.dispose());
  }
}
