# Changelog

## [0.0.1] - 2026-03-16

### Fixed
- improve changelog script for first release handling (8daf1e5)

### Chores
- initialize project and ci/cd (e13cfba)

All notable changes to the **Copilot Commit** extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.1] - 2026-03-16

### Added
- One-click commit message generation from the Source Control toolbar
- 8 built-in commit styles: Conventional Commits, Simple Descriptive, One-Line Summary, GitHub-Style, Semantic Emoji, Detailed/Verbose, Gitmoji, and Angular Style
- Custom prompt templates via `copilotCommit.customPrompts` setting
- Model selection via status bar indicator
- Auto-detect current Copilot Chat model
- Cancellable generation with progress indicator
- Multi-repository support (active editor context)
- Diff truncation with user notification for large changesets

### Security
- Sanitized error messages to prevent internal detail leakage
- No direct network access — all LLM communication through VS Code's `vscode.lm` API
