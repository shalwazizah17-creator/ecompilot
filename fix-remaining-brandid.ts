import fs from 'fs'

const files = [
  'src/app/(dashboard)/products/page.tsx',
  'src/app/(dashboard)/reports/page.tsx',
  'src/app/(dashboard)/scenario/page.tsx',
  'src/app/(dashboard)/settings/affiliate/page.tsx',
  'src/components/ActionCenter.tsx',
  'src/components/MetaAdsAnalytics.tsx',
  'src/components/ProductAnalytics.tsx' // Need to remove brandId prop here too
]

for (const file of files) {
  let content = fs.readFileSync(file, 'utf-8')
  
  // Replace references
  content = content.replace(/\{ brandId \}: \{ brandId: string \}/g, '()')
  content = content.replace(/ brandId=\{brandId\}/g, '')
  content = content.replace(/\?brandId=\$\{brandId\}/g, '')
  content = content.replace(/&brandId=\$\{brandId\}/g, '')
  content = content.replace(/\?brandId=\$\{selectedBrandId\}/g, '')
  content = content.replace(/&brandId=\$\{selectedBrandId\}/g, '')
  
  // Remove object properties
  content = content.replace(/brandId,\n/g, '')
  content = content.replace(/brandId, /g, '')
  
  // Remove if (!selectedBrandId)
  content = content.replace(/[ \t]*if \(!selectedBrandId\) return\n?/g, '')
  
  // Reports
  if (file.includes('reports')) {
    content = content.replace(/const brandId = [^;\n]+;\n?/g, '')
    content = content.replace(/ brandId /g, ' ')
  }
  
  // Scenario
  if (file.includes('scenario')) {
    content = content.replace(/const \{ selectedBrandId \} = useStore\(\)/g, '')
    content = content.replace(/const url = selectedBrandId \? `\/api\/scenario\?brandId=\$\{selectedBrandId\}` : '\/api\/scenario'/g, "const url = '/api/scenario'")
  }

  // Affiliate Settings
  if (file.includes('settings/affiliate')) {
    content = content.replace(/const \{ selectedBrandId \} = useStore\(\)/g, '')
    content = content.replace(/const brandId = selectedBrandId \|\| '[^']+';\n?/g, '')
    content = content.replace(/if \(!selectedBrandId\) return;\n?/g, '')
    content = content.replace(/fetch\(\`\/api\/settings\/affiliate\?brandId=\$\{selectedBrandId\}\`\)/g, "fetch('/api/settings/affiliate')")
    content = content.replace(/, \[selectedBrandId\]\)/g, ", [])")
    content = content.replace(/method: 'POST',/g, "method: 'POST',") // Just a placeholder
  }

  fs.writeFileSync(file, content, 'utf-8')
  console.log('Fixed', file)
}
