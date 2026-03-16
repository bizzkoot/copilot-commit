<p align="center">
  ![Copilot Commit](media/icon.png)
</p>

<p align="center">
  <a href="https://github.com/bizzkoot/copilot-commit/stargazers">
    <img src="https://img.shields.io/github/stars/bizzkoot/copilot-commit?style=social" alt="GitHub Stars" />
  </a>
  <a href="https://github.com/bizzkoot/copilot-commit/forks">
    <img src="https://img.shields.io/github/forks/bizzkoot/copilot-commit?style=social" alt="GitHub Forks" />
  </a>
  <a href="https://github.com/bizzkoot/copilot-commit/watchers">
    <img src="https://img.shields.io/github/watchers/bizzkoot/copilot-commit?style=social" alt="GitHub Watchers" />
  </a>
  <a href="https://github.com/bizzkoot/copilot-commit/issues">
    <img src="https://img.shields.io/github/issues/bizzkoot/copilot-commit" alt="GitHub Issues" />
  </a>
  <a href="https://github.com/bizzkoot/copilot-commit/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/bizzkoot/copilot-commit" alt="License" />
  </a>
  <a href="https://github.com/bizzkoot/copilot-commit/releases">
    <img src="https://img.shields.io/github/v/release/bizzkoot/copilot-commit" alt="GitHub Release" />
  </a>
</p>

# Copilot Commit

Generate structured, semantic commit messages using GitHub Copilot's language models — directly from VS Code's Source Control view.

## Features

- **One-Click Generation** — Click the ✨ sparkle button in the Source Control toolbar to generate a commit message from your staged changes
- **Multiple Styles** — Choose from 8 built-in commit styles:
  - **Conventional Commits** — `<type>(<scope>): <summary>` format
  - **Simple Descriptive** — Clear, readable descriptions
  - **One-Line Summary** — Single concise line for small changes
  - **GitHub-Style** — With issue references and footers
  - **Semantic Emoji** — Conventional commits with emoji prefixes
  - **Detailed/Verbose** — Multi-paragraph with full context and impact analysis
  - **Gitmoji (Rich Emoji)** — Full gitmoji spec with 70+ emoji mappings
  - **Angular Style** — Angular convention with BREAKING CHANGE support
- **Custom Prompts** — Define your own prompt templates in settings
- **Model Selection** — Pick any available Copilot model from the status bar
- **Auto-Detect Model** — Optionally sync with your current Copilot Chat model

## Usage

1. Stage your files in the Source Control view
2. Click the **✨ sparkle** button in the Source Control toolbar
3. The generated commit message appears in the commit input box
4. Edit if needed, then commit!

### Change Model

Click the **$(hubot) Auto** indicator in the status bar (bottom right) to:
- Switch between available Copilot models
- Change commit message style
- Open extension settings

### Change Style

Run `Copilot Commit: Select Commit Style` from the Command Palette (`Cmd+Shift+P`), or use the status bar menu.

## Settings

<details>
<summary>📋 Click to expand settings table</summary>

| Setting | Default | Description |
|---------|---------|-------------|
| `copilotCommit.defaultModel` | `auto` | Default model for generation |
| `copilotCommit.useCurrentChatModel` | `true` | Sync with Copilot Chat model |
| `copilotCommit.defaultStyle` | `conventional` | Default commit style |
| `copilotCommit.customPrompts` | `[]` | Array of custom prompt templates |
| `copilotCommit.showModelInStatusBar` | `true` | Show model in status bar |

</details>

### Custom Prompt Example

<details>
<summary>💡 Click to expand example</summary>

```json
{
  "copilotCommit.customPrompts": [
    {
      "name": "My Team Style",
      "description": "Our team's commit convention",
      "template": "Generate a commit message following our team style:\n- Ticket prefix: [PROJ-XXX]\n- Summary in past tense\n- Max 72 chars\n\nDiff:\n"
    }
  ]
}
```

</details>

## Requirements

- VS Code 1.110+
- GitHub Copilot subscription (active)
- Git extension enabled

## For Developers

Want to contribute or build this extension locally? Here's how to get started:

### Prerequisites

- **Node.js** (v18 or higher recommended)
- **npm** (comes with Node.js)
- **Git** (for cloning the repository)
- **VS Code** (for development)

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/bizzkoot/copilot-commit.git
   cd copilot-commit
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

### Releasing (local)

Run these commands locally to prepare a release and update the `CHANGELOG.md` before tagging:

```bash
# bump version (patch/minor/major) and create a tag
npm version patch -m "chore(release): %s"

# generate/update CHANGELOG.md from commits and commit the change
npm run changelog:generate

# push commits and tags
git push origin main --follow-tags
```

Notes:
- CI still runs the release workflow when you push a `vX.Y.Z` tag. The workflow will also run the changelog script and push the updated `CHANGELOG.md` back to `main`.
- If your branch protection blocks the workflow bot from pushing, allow `github-actions` to push or merge the changelog update via a PR.

<details>
<summary>🔧 Development Commands</summary>

| Command | Description |
|---------|-------------|
| `npm run compile` | Compile TypeScript from `src/` to `out/` |
| `npm run watch` | Compile in watch mode (for development) |
| `npm run lint` | Run ESLint on source files |
| `npm run format` | Format code with Prettier |
| `npm run test` | Run Mocha tests |
| `npm run vscode:prepublish` | Compile before publishing |
| `npm run package` | Build `.vsix` extension package |

</details>

<details>
<summary>📦 Building the Extension</summary>

1. **Compile the code**
   ```bash
   npm run compile
   ```

2. **Create the VSIX package**
   ```bash
   npm run package
   ```

   This creates a `copilot-commit-<version>.vsix` file.

3. **Install locally**
   ```bash
   code --install-extension copilot-commit-<version>.vsix
   ```

</details>

<details>
<summary>🧪 Testing</summary>

```bash
# Run all tests
npm run test

# Run in watch mode during development
npm run watch
```

</details>

### Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT
