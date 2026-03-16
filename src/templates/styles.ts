import * as vscode from 'vscode';

export interface CommitStyle {
  id: string;
  name: string;
  description: string;
  prompt: string;
}

const CONVENTIONAL_COMMITS: CommitStyle = {
  id: 'conventional',
  name: 'Conventional Commits',
  description: 'Structured format: <type>(<scope>): <summary> with optional body',
  prompt: `Generate a Structured, Semantic and Clear Commit message based on the provided diff.
Follow these structural rules strictly:

1. Format: "<type>(<scope>): <summary>"
2. Summary: Imperative mood ("add" not "added"), lowercase, no period, max 50 chars.
3. Body: If the change is complex, include a blank line followed by a bulleted list:
   - Use bullets (-) for distinct technical changes or side effects.
   - Wrap body text at 72 characters.
   - Focus on "what" and "why" rather than "how".
4. Types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert.

IMPORTANT: Output ONLY the raw commit message text. Do NOT wrap it in markdown code blocks, do NOT add explanations, do NOT use backticks or any formatting. Just output the plain text commit message directly.

Diff:
`,
};

const SIMPLE_DESCRIPTIVE: CommitStyle = {
  id: 'simple',
  name: 'Simple Descriptive',
  description: 'Clear, human-readable description without strict conventions',
  prompt: `Generate a clear, descriptive commit message for the following diff.
Rules:
1. Write a short summary line (max 72 chars) that clearly describes what changed.
2. Use imperative mood ("add", "fix", "update").
3. If the change is complex, add a blank line followed by a brief paragraph explaining why.
4. Keep it natural and readable - no strict type prefixes required.

IMPORTANT: Output ONLY the raw commit message text. Do NOT wrap it in markdown code blocks, do NOT add explanations, do NOT use backticks or any formatting. Just output the plain text commit message directly.

Diff:
`,
};

const ONE_LINE: CommitStyle = {
  id: 'oneline',
  name: 'One-Line Summary',
  description: 'Single concise line, perfect for small changes',
  prompt: `Generate a single-line commit message for the following diff.
Rules:
1. EXACTLY one line, max 50 characters.
2. Imperative mood ("add", "fix", "update").
3. Lowercase, no period at the end.
4. Be as concise as possible while remaining descriptive.

IMPORTANT: Output ONLY the raw commit message text. Do NOT wrap it in markdown code blocks, do NOT add explanations, do NOT use backticks or any formatting. Just output the plain text commit message directly.

Diff:
`,
};

const GITHUB_STYLE: CommitStyle = {
  id: 'github',
  name: 'GitHub-Style',
  description: 'Summary with optional issue/PR references and footers',
  prompt: `Generate a GitHub-style commit message for the following diff.
Rules:
1. Format: Short summary line (max 72 chars) in imperative mood.
2. If complex, add a blank line followed by a detailed description.
3. If the diff suggests issue references, include footers like:
   - Closes #<number>
   - Fixes #<number>
   - Related to #<number>
4. Use "Co-authored-by:" footer if multiple contributors are evident.

IMPORTANT: Output ONLY the raw commit message text. Do NOT wrap it in markdown code blocks, do NOT add explanations, do NOT use backticks or any formatting. Just output the plain text commit message directly.

Diff:
`,
};

const SEMANTIC_EMOJI: CommitStyle = {
  id: 'emoji',
  name: 'Semantic Emoji',
  description: 'Conventional commits with emoji prefixes for visual scanning',
  prompt: `Generate a commit message with semantic emoji prefix for the following diff.
Rules:
1. Format: "<emoji> <type>(<scope>): <summary>"
2. Emoji mapping:
   - ✨ feat: New feature
   - 🐛 fix: Bug fix
   - 📝 docs: Documentation
   - 💄 style: Styling/formatting
   - ♻️ refactor: Code refactoring
   - ⚡ perf: Performance improvement
   - ✅ test: Adding/updating tests
   - 🔧 build/chore: Build system or tooling
   - 🔀 ci: CI/CD changes
   - ⏪ revert: Revert changes
3. Summary: Imperative mood, lowercase, no period, max 50 chars.
4. Body: If complex, blank line + bulleted list of changes.

IMPORTANT: Output ONLY the raw commit message text. Do NOT wrap it in markdown code blocks, do NOT add explanations, do NOT use backticks or any formatting. Just output the plain text commit message directly.

Diff:
`,
};

const DETAILED_VERBOSE: CommitStyle = {
  id: 'detailed',
  name: 'Detailed/Verbose',
  description: 'Multi-paragraph commit with full context, reasoning, and impact analysis',
  prompt: `Generate a detailed, verbose commit message for the following diff.
Rules:
1. First line: Short imperative summary (max 50 chars).
2. Blank line after summary.
3. Second paragraph: Explain WHY this change was made (motivation, context, problem being solved).
4. Third paragraph: Describe WHAT changed at a high level and any important technical decisions.
5. Fourth paragraph (if applicable): Note any side effects, breaking changes, or areas impacted.
6. Wrap all body text at 72 characters.
7. Use imperative mood throughout.

IMPORTANT: Output ONLY the raw commit message text. Do NOT wrap it in markdown code blocks, do NOT add explanations, do NOT use backticks or any formatting. Just output the plain text commit message directly.

Diff:
`,
};

const GITMOJI: CommitStyle = {
  id: 'gitmoji',
  name: 'Gitmoji (Rich Emoji)',
  description: 'Full gitmoji spec with rich emoji mapping for every change type',
  prompt: `Generate a commit message following the gitmoji convention for the following diff.
Rules:
1. Format: "<gitmoji> <summary>"
2. Use the MOST appropriate gitmoji from this comprehensive list:
   - 🎨 Improve structure/format of code
   - ⚡️ Improve performance
   - 🔥 Remove code or files
   - 🐛 Fix a bug
   - 🚑️ Critical hotfix
   - ✨ Introduce new features
   - 📝 Add or update documentation
   - 🚀 Deploy stuff
   - 💄 Add or update the UI and style files
   - 🎉 Begin a project
   - ✅ Add, update, or pass tests
   - 🔒️ Fix security or privacy issues
   - 🔐 Add or update secrets
   - 🔖 Release / Version tags
   - 🚨 Fix compiler / linter warnings
   - 🚧 Work in progress
   - 💚 Fix CI Build
   - ⬇️ Downgrade dependencies
   - ⬆️ Upgrade dependencies
   - 📌 Pin dependencies to specific versions
   - 👷 Add or update CI build system
   - 📈 Add or update analytics or tracking code
   - ♻️ Refactor code
   - ➕ Add a dependency
   - ➖ Remove a dependency
   - 🔧 Add or update configuration files
   - 🔨 Add or update development scripts
   - 🌐 Internationalization and localization
   - ✏️ Fix typos
   - 💩 Write bad code that needs to be improved
   - ⏪️ Revert changes
   - 🔀 Merge branches
   - 📦️ Add or update compiled files or packages
   - 👽️ Update code due to external API changes
   - 🚚 Move or rename resources
   - 📄 Add or update license
   - 💥 Introduce breaking changes
   - 🍱 Add or update assets
   - ♿️ Improve accessibility
   - 💡 Add or update comments in source code
   - 🍻 Write code drunkenly
   - 💬 Add or update text and literals
   - 🗃️ Perform database related changes
   - 🔊 Add or update logs
   - 🔇 Remove logs
   - 👥 Add or update contributor(s)
   - 🚸 Improve user experience / usability
   - 🏗️ Make architectural changes
   - 📱 Work on responsive design
   - 🤡 Mock things
   - 🥚 Add or update an easter egg
   - 🙈 Add or update a .gitignore file
   - 📸 Add or update snapshots
   - ⚗️ Perform experiments
   - 🔍️ Improve SEO
   - 🏷️ Add or update types
   - 🌱 Add or update seed files
   - 🚩 Add, update, or remove feature flags
   - 🥅 Catch errors
   - 💫 Add or update animations and transitions
   - 🗑️ Deprecate code that needs to be cleaned up
   - 🛂 Work on code related to authorization, roles and permissions
   - 🩹 Simple fix for a non-critical issue
   - 🧐 Data exploration/inspection
   - ⚰️ Remove dead code
   - 🧪 Add a failing test
   - 👔 Add or update business logic
   - 🩺 Add or update healthcheck
   - 🧱 Infrastructure related changes
   - 🧑‍💻 Improve developer experience
   - 💸 Add sponsorships or money related infrastructure
   - 🧵 Add or update code related to multithreading or concurrency
   - 🦺 Add or update code related to validation
3. Summary: Imperative mood, lowercase, no period, max 50 chars after the emoji.
4. Body (if complex): Blank line + bullet list of key changes.

IMPORTANT: Output ONLY the raw commit message text. Do NOT wrap it in markdown code blocks, do NOT add explanations, do NOT use backticks or any formatting. Just output the plain text commit message directly.

Diff:
`,
};

const ANGULAR_STYLE: CommitStyle = {
  id: 'angular',
  name: 'Angular Style',
  description: 'Angular commit convention with BREAKING CHANGE and footer support',
  prompt: `Generate a commit message following the Angular commit convention for the following diff.
Rules:
1. Format: "<type>(<scope>): <short summary>"
2. Types (required):
   - build: Changes that affect the build system or external dependencies
   - ci: Changes to CI configuration files and scripts
   - docs: Documentation only changes
   - feat: A new feature
   - fix: A bug fix
   - perf: A code change that improves performance
   - refactor: A code change that neither fixes a bug nor adds a feature
   - test: Adding missing tests or correcting existing tests
3. Scope (optional): The section of the codebase affected (e.g., compiler, core, router).
4. Short summary (required):
   - Use imperative, present tense: "change" not "changed" nor "changes"
   - Don't capitalize first letter
   - No period at the end
   - Max 50 characters
5. Body (optional): Blank line after summary. Explain motivation and contrast with previous behavior. Wrap at 72 chars.
6. Footer (optional):
   - BREAKING CHANGE: <description> — for breaking changes
   - Closes #<issue number> — for issue references
   - Deprecated: <description> — for deprecations

IMPORTANT: Output ONLY the raw commit message text. Do NOT wrap it in markdown code blocks, do NOT add explanations, do NOT use backticks or any formatting. Just output the plain text commit message directly.

Diff:
`,
};

export const BUILTIN_STYLES: CommitStyle[] = [
  CONVENTIONAL_COMMITS,
  SIMPLE_DESCRIPTIVE,
  ONE_LINE,
  GITHUB_STYLE,
  SEMANTIC_EMOJI,
  DETAILED_VERBOSE,
  GITMOJI,
  ANGULAR_STYLE,
];

export function getStyleById(id: string): CommitStyle | undefined {
  return BUILTIN_STYLES.find((s) => s.id === id);
}

export function getCustomStyles(): CommitStyle[] {
  const config = vscode.workspace.getConfiguration('copilotCommit');
  const customPrompts = config.get<
    Array<{ name: string; template: string; description?: string }>
  >('customPrompts', []);

  return customPrompts
    .filter((p) => validateCustomPrompt(p))
    .map((p) => ({
      id: `custom-${p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      name: p.name.substring(0, 100),
      description: (p.description || 'Custom prompt template').substring(0, 500),
      prompt: /\bDiff:\s*$/m.test(p.template)
        ? p.template
        : p.template + '\n\nDiff:\n',
    }));
}

function validateCustomPrompt(p: unknown): p is { name: string; template: string; description?: string } {
  if (!p || typeof p !== 'object') { return false; }
  const obj = p as Record<string, unknown>;
  if (typeof obj.name !== 'string' || obj.name.trim().length === 0) { return false; }
  if (typeof obj.template !== 'string' || obj.template.trim().length === 0) { return false; }
  if (obj.name.length > 100) { return false; }
  if (obj.template.length > 5000) { return false; }
  if (obj.description !== undefined && typeof obj.description !== 'string') { return false; }
  if (typeof obj.description === 'string' && obj.description.length > 500) { return false; }
  return true;
}

export function getAllStyles(): CommitStyle[] {
  return [...BUILTIN_STYLES, ...getCustomStyles()];
}
