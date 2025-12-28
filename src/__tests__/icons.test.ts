
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Icon System Verification', () => {
  it('should have Material Symbols Rounded link in index.html', () => {
    const indexPath = path.resolve(__dirname, '../../index.html');
    const indexContent = fs.readFileSync(indexPath, 'utf-8');
    expect(indexContent).toContain('Material+Symbols+Rounded');
  });

  it('should have Material Symbols configuration in index.css', () => {
    const cssPath = path.resolve(__dirname, '../index.css');
    const cssContent = fs.readFileSync(cssPath, 'utf-8');
    expect(cssContent).toContain('.material-symbols-rounded');
    expect(cssContent).toContain('icon-filled');
  });

  it('should have lucide-react centralized in Icons.tsx', () => {
    const iconsPath = path.resolve(__dirname, '../components/ui/Icons.tsx');
    const iconsContent = fs.readFileSync(iconsPath, 'utf-8');
    expect(iconsContent).toContain("from 'lucide-react'");
  });
});
