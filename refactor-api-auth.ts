import fs from 'fs'
import path from 'path'

const apiDir = path.join(__dirname, 'src', 'app', 'api')

function findFiles(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir)
  for (const file of files) {
    const filePath = path.join(dir, file)
    if (fs.statSync(filePath).isDirectory()) {
      findFiles(filePath, fileList)
    } else if (file === 'route.ts' || file === 'route.tsx') {
      fileList.push(filePath)
    }
  }
  return fileList
}

const allRoutes = findFiles(apiDir)

let updatedCount = 0

for (const routePath of allRoutes) {
  let content = fs.readFileSync(routePath, 'utf8')
  
  if (content.includes("searchParams.get('brandId')")) {
    
    // Add import if not present
    if (!content.includes('assertBrandAccess')) {
      // Find the last import statement
      const importMatches = [...content.matchAll(/^import .* from .*$/gm)]
      if (importMatches.length > 0) {
        const lastMatch = importMatches[importMatches.length - 1]
        const insertIndex = lastMatch.index! + lastMatch[0].length
        content = content.slice(0, insertIndex) + '\nimport { assertBrandAccess } from "@/lib/auth/assert-brand-access"' + content.slice(insertIndex)
      } else {
        content = 'import { assertBrandAccess } from "@/lib/auth/assert-brand-access"\n' + content
      }
    }

    // Replace the standard parameter check with the secure one
    // Standard pattern varies, but usually it's:
    // const brandId = searchParams.get('brandId')
    // if (!brandId) return NextResponse.json({ error: '...' }, { status: 400 })
    
    // We will do a generic regex replace
    const regex = /const\s+brandId\s*=\s*searchParams\.get\(['"]brandId['"]\)(?: as string)?[\r\n\s]+if\s*\(!brandId\)\s*return\s+NextResponse\.json\(\{\s*error:\s*['"][^'"]+['"]\s*\}\s*,\s*\{\s*status:\s*400\s*\}\)/g
    
    const secureBlock = `const brandIdParam = searchParams.get('brandId')
  if (!brandIdParam) return NextResponse.json({ error: 'Missing brandId parameter' }, { status: 400 })
  
  const brand = await assertBrandAccess(brandIdParam)
  if (!brand) return NextResponse.json({ error: 'Forbidden. You do not have access to this workspace/brand.' }, { status: 403 })
  
  const brandId = brand.id`
    
    if (regex.test(content)) {
      content = content.replace(regex, secureBlock)
      fs.writeFileSync(routePath, content, 'utf8')
      console.log(`Updated ${routePath}`)
      updatedCount++
    } else {
      console.log(`Pattern not matched exactly in ${routePath}, please review manually.`)
    }
  }
}

console.log(`Refactored ${updatedCount} API routes for Tenant Security.`)
