// Mock vscode module for unit tests
export const workspace = {
  getConfiguration: (_section?: string) => ({
    get: <T>(_key: string, defaultValue?: T): T | undefined => defaultValue,
  }),
  onDidChangeConfiguration: () => ({ dispose: () => {} }),
};

export const window = {
  createStatusBarItem: () => ({
    show: () => {},
    hide: () => {},
    dispose: () => {},
    text: '',
    tooltip: '',
    command: '',
  }),
  showQuickPick: async () => undefined,
  showInformationMessage: async () => undefined,
  showWarningMessage: async () => undefined,
  showErrorMessage: async () => undefined,
  createOutputChannel: () => ({
    appendLine: () => {},
    dispose: () => {},
  }),
};

export const StatusBarAlignment = { Left: 1, Right: 2 };
export const ProgressLocation = { Notification: 15 };

export const commands = {
  registerCommand: () => ({ dispose: () => {} }),
  executeCommand: async () => {},
};

export const extensions = {
  getExtension: () => undefined,
};

export const lm = {
  selectChatModels: async () => [],
  onDidChangeChatModels: () => ({ dispose: () => {} }),
};

export const LanguageModelChatMessage = {
  User: (content: string) => ({ role: 'user', content }),
};

export class LanguageModelError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.code = code;
  }
}

export const Uri = {
  file: (path: string) => ({ fsPath: path, scheme: 'file' }),
};
