/**
 * WCAG Contrast Checker for win2grow design system
 * Checks all foreground/background token pairs against WCAG 2.1 AA and AAA
 */

// ─── COLOR TOKENS ────────────────────────────────────────────────────────────

const LIGHT = {
  'bg-page':              '#f8fafc',
  'bg-card':              '#ffffff',
  'bg-card-header':       '#ffffff',
  'bg-surface':           '#f1f5f9',
  'bg-hover':             '#e2e8f0',
  'bg-active':            '#e0e7ff',
  'bg-input':             '#ffffff',

  'text-main':            '#0f172a',
  'text-secondary':       '#334155',
  'text-muted':           '#64748b',
  'text-primary':         '#4f46e5',

  'primary-base':         '#4f46e5',
  'primary-hover':        '#4338ca',

  'status-success-bg':    '#f0fdf4',
  'status-success-text':  '#15803d',
  'status-error-bg':      '#fef2f2',
  'status-error-text':    '#b91c1c',
  'status-danger-border': '#dc2626',

  'action-edit-bg':       '#f0fdf4',
  'action-edit-text':     '#15803d',
  'action-edit-hover':    '#dcfce7',
  'action-delete-bg':     '#fef2f2',
  'action-delete-text':   '#b91c1c',
  'action-delete-hover':  '#fee2e2',
  'action-secondary-bg':  '#eef2ff',
  'action-secondary-text':'#4f46e5',
  'action-secondary-hover':'#e0e7ff',

  'acc-settings':         '#047857',
  'acc-points':           '#c2410c',
  'acc-goals':            '#7c3aed',
  'acc-data':             '#2563eb',
  'acc-logs':             '#a16207',
};

const DARK = {
  'bg-page':              '#020617',
  'bg-card':              '#0f172a',
  'bg-card-header':       '#0f172a',
  'bg-surface':           '#1e293b',
  'bg-hover':             '#334155',
  'bg-active':            '#3730a3', // rgba(79,70,229,0.2) on #0f172a
  'bg-input':             '#020617',

  'text-main':            '#f8fafc',
  'text-secondary':       '#cbd5e1',
  'text-muted':           '#94a3b8',
  'text-primary':         '#818cf8',

  'primary-base':         '#4f46e5',
  'primary-hover':        '#4338ca',

  'status-success-bg':    '#134e2a', // rgba(22,163,74,0.15) on #0f172a
  'status-success-text':  '#4ade80',
  'status-error-bg':      '#3b0f0f', // rgba(220,38,38,0.15) on #0f172a
  'status-error-text':    '#f87171',
  'status-danger-border': '#dc2626',

  'action-edit-bg':       '#0d2b1a', // rgba(34,197,94,0.1) on #0f172a
  'action-edit-text':     '#4ade80',
  'action-edit-hover':    '#133d25',
  'action-delete-bg':     '#2b0d0d', // rgba(239,68,68,0.1) on #0f172a
  'action-delete-text':   '#f87171',
  'action-delete-hover':  '#3d1313',
  'action-secondary-bg':  '#131633', // rgba(99,102,241,0.1) on #0f172a
  'action-secondary-text':'#818cf8',
  'action-secondary-hover':'#1e2050',

  'acc-settings':         '#34d399',
  'acc-points':           '#fb923c',
  'acc-goals':            '#a78bfa',
  'acc-data':             '#60a5fa',
  'acc-logs':             '#facc15',
};

// ─── PAIRS TO CHECK ───────────────────────────────────────────────────────────
// [label, fg-token, bg-token, usage-description]

const PAIRS = [
  // Core text on backgrounds
  ['Body text on page',         'text-main',            'bg-page',          'Page body text'],
  ['Body text on card',         'text-main',            'bg-card',          'Card content text'],
  ['Body text on surface',      'text-main',            'bg-surface',       'Section/table rows'],
  ['Secondary text on page',    'text-secondary',       'bg-page',          'Labels, descriptions'],
  ['Secondary text on card',    'text-secondary',       'bg-card',          'Card subtext'],
  ['Secondary text on surface', 'text-secondary',       'bg-surface',       'Table row text'],
  ['Muted text on page',        'text-muted',           'bg-page',          'Captions, hints'],
  ['Muted text on card',        'text-muted',           'bg-card',          'Placeholder, muted info'],
  ['Muted text on surface',     'text-muted',           'bg-surface',       'Secondary labels'],
  ['Muted text on input',       'text-muted',           'bg-input',         'Placeholder text'],

  // Primary / interactive
  ['Primary text on page',      'text-primary',         'bg-page',          'Links, active states'],
  ['Primary text on card',      'text-primary',         'bg-card',          'Links inside cards'],
  ['Primary text on surface',   'text-primary',         'bg-surface',       'Links in sections'],
  ['White on primary-base',     null,                   'primary-base',     'Button labels (white text)', '#ffffff'],
  ['White on primary-hover',    null,                   'primary-hover',    'Button hover labels', '#ffffff'],

  // Status — success
  ['Success text on success-bg','status-success-text',  'status-success-bg','Toast / badge'],
  ['Success text on card',      'status-success-text',  'bg-card',          'Inline success message'],

  // Status — error / danger
  ['Error text on error-bg',    'status-error-text',    'status-error-bg',  'Toast / badge'],
  ['Error text on card',        'status-error-text',    'bg-card',          'Inline error message'],
  ['White on danger-border',    null,                   'status-danger-border', 'Danger button hover', '#ffffff'],

  // Action buttons
  ['Edit text on edit-bg',      'action-edit-text',     'action-edit-bg',   'Edit button default'],
  ['Edit text on edit-hover',   'action-edit-text',     'action-edit-hover','Edit button hover'],
  ['Delete text on delete-bg',  'action-delete-text',   'action-delete-bg', 'Delete button default'],
  ['Delete text on delete-hover','action-delete-text',  'action-delete-hover','Delete button hover'],
  ['Secondary text on sec-bg',  'action-secondary-text','action-secondary-bg','Secondary button'],
  ['Secondary text on sec-hover','action-secondary-text','action-secondary-hover','Secondary btn hover'],

  // Accent icons on backgrounds
  ['Acc-settings on card',      'acc-settings',         'bg-card',          'Settings icon'],
  ['Acc-settings on surface',   'acc-settings',         'bg-surface',       'Settings icon on surface'],
  ['Acc-points on card',        'acc-points',           'bg-card',          'Points icon'],
  ['Acc-goals on card',         'acc-goals',            'bg-card',          'Goals icon'],
  ['Acc-data on card',          'acc-data',             'bg-card',          'Data icon'],
  ['Acc-logs on card',          'acc-logs',             'bg-card',          'Logs icon'],
  ['Acc-logs on surface',       'acc-logs',             'bg-surface',       'Logs icon on surface'],

  // Input border (border vs background — informational only)
  ['Body text in input',        'text-main',            'bg-input',         'Input field text'],
];

// ─── WCAG MATH ────────────────────────────────────────────────────────────────

function hexToRgb(hex) {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  const n = parseInt(hex, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function linearize(c) {
  c /= 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function luminance({ r, g, b }) {
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

function contrast(hex1, hex2) {
  const L1 = luminance(hexToRgb(hex1));
  const L2 = luminance(hexToRgb(hex2));
  const bright = Math.max(L1, L2);
  const dark   = Math.min(L1, L2);
  return (bright + 0.05) / (dark + 0.05);
}

function grade(ratio, isLargeText = false) {
  if (isLargeText) {
    if (ratio >= 4.5) return 'AAA';
    if (ratio >= 3.0) return 'AA ';
    return 'FAIL';
  }
  if (ratio >= 7.0) return 'AAA';
  if (ratio >= 4.5) return 'AA ';
  if (ratio >= 3.0) return 'AA* (large only)';
  return 'FAIL';
}

// ─── RUNNER ───────────────────────────────────────────────────────────────────

function checkTheme(name, tokens) {
  const results = { pass: [], warn: [], fail: [] };

  for (const [label, fgToken, bgToken, usage, fgOverride] of PAIRS) {
    const fg = fgOverride || tokens[fgToken];
    const bg = tokens[bgToken];

    if (!fg || !bg) {
      results.warn.push({ label, usage, note: `Missing token: ${!fg ? fgToken : bgToken}` });
      continue;
    }

    let fgHex = fg, bgHex = bg;

    // Skip rgba tokens that can't be simply converted (they're composited on bg)
    if (fgHex.startsWith('rgba') || bgHex.startsWith('rgba')) {
      results.warn.push({ label, usage, note: 'rgba token — skipped (requires compositing)' });
      continue;
    }

    const ratio = contrast(fgHex, bgHex);
    const g = grade(ratio);
    const entry = { label, usage, fg: fgHex, bg: bgHex, ratio: ratio.toFixed(2), grade: g };

    if (g === 'FAIL') results.fail.push(entry);
    else if (g.includes('large only')) results.warn.push({ ...entry, note: 'AA only for text ≥18px bold or ≥24px' });
    else results.pass.push(entry);
  }

  return results;
}

function printResults(name, results) {
  const RESET  = '\x1b[0m';
  const GREEN  = '\x1b[32m';
  const YELLOW = '\x1b[33m';
  const RED    = '\x1b[31m';
  const BOLD   = '\x1b[1m';
  const DIM    = '\x1b[2m';

  console.log(`\n${BOLD}${'═'.repeat(72)}${RESET}`);
  console.log(`${BOLD}  ${name}${RESET}`);
  console.log(`${'═'.repeat(72)}${RESET}`);

  const col = (s, w) => s.toString().padEnd(w);

  if (results.fail.length) {
    console.log(`\n${RED}${BOLD}  ❌ FAILURES (${results.fail.length})${RESET}`);
    console.log(`${DIM}  ${'Label'.padEnd(38)} ${'Ratio'.padEnd(8)} Grade   FG        BG${RESET}`);
    for (const r of results.fail) {
      console.log(`${RED}  ✗ ${col(r.label,36)} ${col(r.ratio+':1',8)} ${col(r.grade,7)} ${r.fg}  ${r.bg}${RESET}`);
      console.log(`${DIM}    → ${r.usage}${RESET}`);
    }
  }

  if (results.warn.length) {
    console.log(`\n${YELLOW}${BOLD}  ⚠  WARNINGS (${results.warn.length})${RESET}`);
    console.log(`${DIM}  ${'Label'.padEnd(38)} ${'Ratio'.padEnd(8)} Grade${RESET}`);
    for (const r of results.warn) {
      if (r.ratio) {
        console.log(`${YELLOW}  ⚠ ${col(r.label,36)} ${col(r.ratio+':1',8)} ${r.grade}${RESET}`);
        console.log(`${DIM}    → ${r.note || r.usage}${RESET}`);
      } else {
        console.log(`${YELLOW}  ⚠ ${col(r.label,36)} ${r.note}${RESET}`);
      }
    }
  }

  if (results.pass.length) {
    console.log(`\n${GREEN}${BOLD}  ✅ PASSING (${results.pass.length})${RESET}`);
    console.log(`${DIM}  ${'Label'.padEnd(38)} ${'Ratio'.padEnd(8)} Grade${RESET}`);
    for (const r of results.pass) {
      console.log(`${GREEN}  ✓ ${col(r.label,36)} ${col(r.ratio+':1',8)} ${r.grade}${RESET}`);
    }
  }

  const total = results.pass.length + results.warn.length + results.fail.length;
  const score = Math.round((results.pass.length / total) * 100);
  const color = score === 100 ? GREEN : score >= 80 ? YELLOW : RED;
  console.log(`\n${color}${BOLD}  Score: ${results.pass.length}/${total} passing (${score}%)${RESET}\n`);
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

const lightResults = checkTheme('☀️  LIGHT MODE', LIGHT);
const darkResults  = checkTheme('🌙  DARK MODE',  DARK);

printResults('☀️  LIGHT MODE', lightResults);
printResults('🌙  DARK MODE',  darkResults);

// Summary
const BOLD = '\x1b[1m'; const RESET = '\x1b[0m';
const allFails = [...lightResults.fail, ...darkResults.fail];
console.log(`${'─'.repeat(72)}`);
console.log(`${BOLD}TOTAL FAILURES: ${allFails.length}${RESET}`);
if (allFails.length === 0) {
  console.log('\x1b[32m All pairs meet WCAG AA! 🎉\x1b[0m\n');
} else {
  console.log('\x1b[31m Fix the above before shipping.\x1b[0m\n');
}
