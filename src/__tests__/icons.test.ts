
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

  it('should not have lucide-react imports in Dashboard components', () => {
    const srcPath = path.resolve(__dirname, '..');
    const dashboardPath = path.resolve(srcPath, 'components/dashboard');
    const studentDashboardFile = path.resolve(srcPath, 'components/Dashboard.tsx');
    
    let filesToCheck = [];
    if (fs.existsSync(dashboardPath)) {
      filesToCheck = filesToCheck.concat(getFilesRecursive(dashboardPath));
    }
    if (fs.existsSync(studentDashboardFile)) {
      filesToCheck.push(studentDashboardFile);
    }

    const lucideImports = filesToCheck.filter(file => {
      // Exclude tests themselves
      if (file.endsWith('.test.ts') || file.endsWith('.test.tsx')) return false;
      
      // Check if it's a code file
      const ext = path.extname(file);
      if (!['.ts', '.tsx', '.js', '.jsx'].includes(ext)) return false;

      const content = fs.readFileSync(file, 'utf-8');
      return content.includes("from 'lucide-react'");
    });
    
    if (lucideImports.length > 0) {
      console.log('Dashboard files mistakenly using lucide-react:', lucideImports.map(f => path.relative(srcPath, f)));
    }
    
    expect(lucideImports).toEqual([]);
  });

  it('should allow lucide-react in Admin and UI components', () => {
    const adminLayoutPath = path.resolve(__dirname, '../components/AdminLayout.tsx');
    const content = fs.readFileSync(adminLayoutPath, 'utf-8');
    expect(content).toContain("from 'lucide-react'");
  });
});

function getFilesRecursive(dir: string): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.resolve(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFilesRecursive(file));
    } else {
      results.push(file);
    }
  });
  return results;
}
