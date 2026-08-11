import fs from 'fs'
import path from 'path'

function walkSync(dir: string, fileList: string[] = []) {
  if (!fs.existsSync(dir)) return fileList
  const files = fs.readdirSync(dir)
  for (const file of files) {
    const filePath = path.join(dir, file)
    if (fs.statSync(filePath).isDirectory()) {
      walkSync(filePath, fileList)
    } else if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
      fileList.push(filePath)
    }
  }
  return fileList
}

const dashboardFiles = walkSync(path.join(process.cwd(), 'src/app/(dashboard)'))
const componentFiles = walkSync(path.join(process.cwd(), 'src/components'))
const allFiles = [...dashboardFiles, ...componentFiles]

let filesModified = 0

for (const file of allFiles) {
  let content = fs.readFileSync(file, 'utf-8')
  const originalContent = content

  // 1. Remove const { selectedBrandId } = useStore()
  content = content.replace(/[ \t]*const { selectedBrandId } = useStore\(\)\n?/g, '')

  // 1b. Remove useStore import if only used for selectedBrandId
  // Wait, if we removed useStore(), we can safely remove the import if useStore is no longer in the file
  if (!content.includes('useStore(')) {
    content = content.replace(/import { useStore } from '@\/store\/useStore';?\n/g, '')
  }

  // 3. Remove const brandId = selectedBrandId || '...'
  content = content.replace(/[ \t]*const brandId = selectedBrandId \|\| '[^']+'\n?/g, '')
  
  // 4. Remove if (!selectedBrandId) return
  content = content.replace(/[ \t]*if \(!selectedBrandId\) return\n?/g, '')

  // 5. Replace `?brandId=${selectedBrandId}` with nothing
  content = content.replace(/\?brandId=\$\{selectedBrandId\}/g, '')
  content = content.replace(/&brandId=\$\{selectedBrandId\}/g, '')
  
  // 6. Replace `?brandId=${brandId}` with nothing
  content = content.replace(/\?brandId=\$\{brandId\}/g, '')
  content = content.replace(/&brandId=\$\{brandId\}/g, '')
  
  // 7. Fix urls like: const url = selectedBrandId ? `/api/intelligence/daily?brandId=${selectedBrandId}` : '/api/intelligence/daily'
  content = content.replace(/const url = selectedBrandId \? `\/api\/[^`]+` : '(\/api\/[^']+)'/g, "const url = '$1'")

  // 8. Handle <ActionCenter brandId={brandId} /> etc
  content = content.replace(/ brandId={brandId}/g, '')
  
  // 10. GlobalFilters.tsx specific fixes
  if (file.includes('GlobalFilters.tsx')) {
    content = content.replace(/[ \t]*params\.set\('brandId', selectedBrandId \|\| '[^']+'\)\n?/g, '')
  }
  
  // Handle component props that expect brandId
  if (file.includes('ActionCenter.tsx') || file.includes('MarketingAdvisor.tsx') || file.includes('MetaAdsAnalytics.tsx')) {
    content = content.replace(/\{ brandId \}: \{ brandId: string \}/g, '()')
  }

  // Handle dependency arrays [selectedBrandId] -> []
  content = content.replace(/, \[selectedBrandId\]\)/g, ', [])')
  content = content.replace(/, \[brandId\]\)/g, ', [])')

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf-8')
    console.log(`Updated: ${file.replace(process.cwd(), '')}`)
    filesModified++
  }
}

console.log(`\nRefactoring complete. ${filesModified} files modified.`)
