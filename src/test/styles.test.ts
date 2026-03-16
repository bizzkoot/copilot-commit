import * as assert from 'assert';
import {
  getStyleById,
  getAllStyles,
  BUILTIN_STYLES,
} from '../templates/styles';

describe('Styles', () => {
  describe('BUILTIN_STYLES', () => {
    it('should have 8 built-in styles', () => {
      assert.strictEqual(BUILTIN_STYLES.length, 8);
    });

    it('should have unique IDs', () => {
      const ids = BUILTIN_STYLES.map((s) => s.id);
      const uniqueIds = new Set(ids);
      assert.strictEqual(ids.length, uniqueIds.size);
    });

    it('each style should have required fields', () => {
      for (const style of BUILTIN_STYLES) {
        assert.ok(style.id, `Style missing id`);
        assert.ok(style.name, `Style ${style.id} missing name`);
        assert.ok(style.description, `Style ${style.id} missing description`);
        assert.ok(style.prompt, `Style ${style.id} missing prompt`);
      }
    });

    it('each prompt should end with "Diff:\\n"', () => {
      for (const style of BUILTIN_STYLES) {
        assert.ok(
          style.prompt.trimEnd().endsWith('Diff:'),
          `Style ${style.id} prompt does not end with "Diff:"`,
        );
      }
    });

    it('each prompt should instruct raw output only', () => {
      for (const style of BUILTIN_STYLES) {
        assert.ok(
          style.prompt.includes('IMPORTANT: Output ONLY the raw commit message text'),
          `Style ${style.id} missing raw output instruction`,
        );
      }
    });
  });

  describe('getStyleById', () => {
    it('should return conventional style', () => {
      const style = getStyleById('conventional');
      assert.ok(style);
      assert.strictEqual(style.name, 'Conventional Commits');
    });

    it('should return undefined for unknown ID', () => {
      const style = getStyleById('nonexistent');
      assert.strictEqual(style, undefined);
    });

    it('should find all 8 built-in styles by ID', () => {
      const ids = [
        'conventional',
        'simple',
        'oneline',
        'github',
        'emoji',
        'detailed',
        'gitmoji',
        'angular',
      ];
      for (const id of ids) {
        assert.ok(getStyleById(id), `Style ${id} not found`);
      }
    });
  });

  describe('getAllStyles', () => {
    it('should include all built-in styles', () => {
      const all = getAllStyles();
      assert.ok(all.length >= BUILTIN_STYLES.length);
      for (const builtin of BUILTIN_STYLES) {
        assert.ok(
          all.find((s) => s.id === builtin.id),
          `Built-in style ${builtin.id} missing from getAllStyles()`,
        );
      }
    });
  });
});
