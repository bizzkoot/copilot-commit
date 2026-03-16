import * as vscode from 'vscode';
import { ModelManager } from './modelManager';
import { log, logError } from './logger';

export class CopilotService {
  constructor(private modelManager: ModelManager) {}

  async generateCommitMessage(
    diff: string,
    promptTemplate: string,
    token?: vscode.CancellationToken,
  ): Promise<string | undefined> {
    const model = await this.modelManager.selectModel();
    if (!model) {
      log('No model available for commit generation');
      return undefined;
    }

    log(`Using model: ${model.name || model.family} (max ${model.maxInputTokens} tokens)`);

    // Truncate diff if it exceeds model's token limit (leave room for prompt)
    const promptTokenEstimate = Math.ceil(promptTemplate.length / 2);
    const maxDiffTokens = Math.max(model.maxInputTokens - promptTokenEstimate - 500, 1000);
    const maxDiffLength = Math.min(maxDiffTokens * 2, 100000);
    let truncatedDiff = diff;
    let wasTruncated = false;
    if (diff.length > maxDiffLength) {
      truncatedDiff =
        diff.substring(0, maxDiffLength) +
        '\n\n... [diff truncated due to size]';
      wasTruncated = true;
      log(`Diff truncated from ${diff.length} to ${maxDiffLength} chars`);
    }

    const fullPrompt = promptTemplate + truncatedDiff;

    const messages = [
      vscode.LanguageModelChatMessage.User(fullPrompt),
    ];

    try {
      log('Sending request to model...');
      const response = await model.sendRequest(
        messages,
        {
          justification:
            'Copilot Commit needs to analyze your staged changes to generate a commit message.',
        },
        token,
      );

      let result = '';
      for await (const chunk of response.text) {
        if (token?.isCancellationRequested) {
          log('Generation cancelled by user during streaming');
          return undefined;
        }
        result += chunk;
      }

      // Clean up: remove any markdown code blocks or backticks
      result = this.cleanResponse(result);

      if (wasTruncated) {
        vscode.window.showWarningMessage(
          'Copilot Commit: Diff was truncated due to size. The commit message may not cover all changes.',
        );
      }

      return result.trim();
    } catch (error) {
      // Don't show error if user cancelled the request
      if (token?.isCancellationRequested) {
        log('Generation cancelled by user');
        return undefined;
      }
      logError('Failed to generate commit message', error);
      if (error instanceof vscode.LanguageModelError) {
        switch (error.code) {
          case 'NoPermissions':
            vscode.window.showErrorMessage(
              'Copilot Commit: Permission denied. Please allow the extension to use Copilot.',
            );
            break;
          case 'NotFound':
            vscode.window.showErrorMessage(
              'Copilot Commit: Model not found. Try selecting a different model.',
            );
            break;
          case 'Blocked':
            vscode.window.showErrorMessage(
              'Copilot Commit: Request blocked. You may have exceeded your quota.',
            );
            break;
          default:
            vscode.window.showErrorMessage(
              'Copilot Commit: An unexpected error occurred. Check the output channel for details.',
            );
        }
      } else {
        vscode.window.showErrorMessage(
          'Copilot Commit: Failed to generate commit message. Please try again.',
        );
      }
      return undefined;
    }
  }

  private cleanResponse(text: string): string {
    // Remove markdown code blocks
    let cleaned = text.replace(/^```[\w]*\n?/gm, '').replace(/\n?```$/gm, '');

    // Remove leading/trailing backticks
    cleaned = cleaned.replace(/^`+|`+$/g, '');

    // Remove any preamble lines before the actual commit message
    cleaned = cleaned.replace(
      /^(here(?:'?s| is)\s+(the\s+|your\s+)?(suggested\s+|generated\s+)?(commit\s+)?message:?\s*\n?)/i,
      '',
    );
    cleaned = cleaned.replace(
      /^(commit\s+message:?\s*\n?)/i,
      '',
    );

    return cleaned.trim();
  }
}
