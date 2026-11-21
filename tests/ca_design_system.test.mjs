import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('CA Glassmorphism Design System Suite', () => {
  const cssPath = path.resolve('src/index.css');
  const cssContent = fs.readFileSync(cssPath, 'utf-8');

  test('defines glassmorphism surface tokens and Apple HIG palette', () => {
    assert.ok(cssContent.includes('--zd-glass-bg'), 'Missing --zd-glass-bg token');
    assert.ok(cssContent.includes('--zd-glass-border'), 'Missing --zd-glass-border token');
    assert.ok(cssContent.includes('--zd-glass-blur'), 'Missing --zd-glass-blur token');
    assert.ok(cssContent.includes('--zd-glass-shadow'), 'Missing --zd-glass-shadow token');
    assert.ok(cssContent.includes('--color-brand'), 'Missing --color-brand token');
    assert.ok(cssContent.includes('--status-success'), 'Missing --status-success token');
    assert.ok(cssContent.includes('--status-warning'), 'Missing --status-warning token');
    assert.ok(cssContent.includes('--status-error'), 'Missing --status-error token');
  });

  test('includes dark mode token overrides', () => {
    assert.ok(cssContent.includes('[data-theme="dark"]'), 'Missing dark mode theme block');
  });

  test('includes standard card, button, and badge foundation classes', () => {
    assert.ok(cssContent.includes('.zd-card'), 'Missing .zd-card');
    assert.ok(cssContent.includes('.btn-primary'), 'Missing .btn-primary');
    assert.ok(cssContent.includes('.btn-outline'), 'Missing .btn-outline');
    assert.ok(cssContent.includes('.badge-success'), 'Missing .badge-success');
  });
});
