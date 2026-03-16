import * as assert from 'assert';

// Test the cleanResponse logic directly (extracted for testability)
function cleanResponse(text: string): string {
  let cleaned = text.replace(/^```[\w]*\n?/gm, '').replace(/\n?```$/gm, '');
  cleaned = cleaned.replace(/^`+|`+$/g, '');
  cleaned = cleaned.replace(
    /^(here(?:'?s| is)\s+(the\s+)?(commit\s+)?message:?\s*\n?)/i,
    '',
  );
  return cleaned.trim();
}

describe('cleanResponse', () => {
  it('should return plain text unchanged', () => {
    const input = 'feat(auth): add login endpoint';
    assert.strictEqual(cleanResponse(input), input);
  });

  it('should remove markdown code blocks', () => {
    const input = '```\nfeat(auth): add login\n```';
    assert.strictEqual(cleanResponse(input), 'feat(auth): add login');
  });

  it('should remove code blocks with language identifier', () => {
    const input = '```text\nfeat(auth): add login\n```';
    assert.strictEqual(cleanResponse(input), 'feat(auth): add login');
  });

  it('should remove leading/trailing backticks', () => {
    const input = '`feat(auth): add login`';
    assert.strictEqual(cleanResponse(input), 'feat(auth): add login');
  });

  it('should remove "Here\'s the commit message:" preamble', () => {
    const input = "Here's the commit message:\nfeat(auth): add login";
    assert.strictEqual(cleanResponse(input), 'feat(auth): add login');
  });

  it('should remove "Here is the message:" preamble', () => {
    const input = 'Here is the message:\nfeat(auth): add login';
    assert.strictEqual(cleanResponse(input), 'feat(auth): add login');
  });

  it('should handle multiline commit messages', () => {
    const input = 'feat(auth): add login endpoint\n\n- Add JWT validation\n- Add refresh token support';
    assert.strictEqual(cleanResponse(input), input);
  });

  it('should trim whitespace', () => {
    const input = '  feat(auth): add login  ';
    assert.strictEqual(cleanResponse(input), 'feat(auth): add login');
  });

  it('should handle empty string', () => {
    assert.strictEqual(cleanResponse(''), '');
  });

  it('should handle only backticks', () => {
    assert.strictEqual(cleanResponse('``````'), '');
  });
});
