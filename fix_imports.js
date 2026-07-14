import fs from 'fs';

const missingDbFunctions = [
  'doc', 'getDoc', 'getDocs', 'addDoc', 'setDoc', 'updateDoc', 'deleteDoc',
  'collection', 'query', 'where', 'orderBy', 'limit', 'onSnapshot',
  'serverTimestamp', 'writeBatch'
];

const filesToFix = [
  'src/components/CompanyInbox.tsx',
  'src/components/CompanyProducts.tsx',
  'src/pages/AppStore.tsx',
  'src/pages/Dashboard.tsx',
  'src/pages/Insights.tsx',
  'src/pages/LogisticsModule.tsx',
  'src/pages/Marketplace.tsx',
  'src/pages/WarehousingModule.tsx'
];

for (const file of filesToFix) {
  let content = fs.readFileSync(file, 'utf8');
  
  const used = missingDbFunctions.filter(fn => {
    const regex = new RegExp(`\\b${fn}\\s*\\(`, 'g');
    return regex.test(content);
  });
  
  if (used.length > 0) {
    let importLineRegex = /import\s+{([^}]+)}\s+from\s+['"]\.\.\/lib\/db['"]/;
    if (importLineRegex.test(content)) {
      content = content.replace(importLineRegex, (match, p1) => {
        let imports = p1.split(',').map(s => s.trim());
        used.forEach(u => {
          if (!imports.includes(u)) imports.push(u);
        });
        return `import { ${imports.join(', ')} } from '../lib/db'`;
      });
    } else {
      content = `import { ${used.join(', ')} } from '../lib/db';\n` + content;
    }
  }
  
  if (file.includes('CompanyInbox.tsx') && !content.includes('import { getApiUrl }')) {
    content = `import { getApiUrl } from '../lib/apiConfig';\n` + content;
  }
  
  fs.writeFileSync(file, content);
}
