import fs from 'fs';

const filesToFix = [
  'src/pages/LogisticsModule.tsx',
  'src/pages/WarehousingModule.tsx',
  'src/pages/AppStore.tsx',
  'src/pages/Dashboard.tsx',
  'src/pages/Insights.tsx',
  'src/pages/Marketplace.tsx',
  'src/components/CompanyProducts.tsx'
];

for (const file of filesToFix) {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('import {') && content.includes('../lib/db')) {
    if (content.includes(' db') && !content.includes('db,')) {
      // it might not be imported. Wait, let's just make sure db and auth are in the import list.
    }
  }
  
  // Just simple replacement:
  const regex = /import\s+{([^}]+)}\s+from\s+['"]\.\.\/lib\/db['"]/;
  if (regex.test(content)) {
    content = content.replace(regex, (match, p1) => {
      let imports = p1.split(',').map(s => s.trim());
      if (content.includes('db,') || content.includes('db.') || content.includes('(db,')) {
         if (!imports.includes('db')) imports.push('db');
      }
      if (content.includes('auth.') || content.includes('auth,')) {
         if (!imports.includes('auth')) imports.push('auth');
      }
      return `import { ${imports.join(', ')} } from '../lib/db'`;
    });
  }
  
  fs.writeFileSync(file, content);
}
