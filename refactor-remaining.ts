import fs from 'fs'
import path from 'path'

const filesToFix = [
  'src/app/api/actions/generate/route.ts',
  'src/app/api/actions/route.ts',
  'src/app/api/dashboard/route.ts',
  'src/app/api/meta-ads/route.ts',
  'src/app/api/oauth/authorize/route.ts',
  'src/app/api/products/route.ts'
]

for (const file of filesToFix) {
  const filePath = path.join(__dirname, file)
  if (!fs.existsSync(filePath)) continue
  
  let content = fs.readFileSync(filePath, 'utf8')
  
  if (!content.includes('assertBrandAccess')) {
    content = 'import { assertBrandAccess } from "@/lib/auth/assert-brand-access"\n' + content
  }

  // Find the generic pattern: const brandId = searchParams.get('brandId') ... if (!brandId) { ... }
  const regex = /const\s+brandId\s*=\s*searchParams\.get\(['"]brandId['"]\)(?: as string)?[\s\S]*?if\s*\(!brandId\)\s*\{[\s\S]*?\}/
  
  const secureBlock = `const brandIdParam = searchParams.get('brandId')
    if (!brandIdParam) {
      return NextResponse.json({ error: 'Missing brandId parameter' }, { status: 400 })
    }
    
    const brand = await assertBrandAccess(brandIdParam)
    if (!brand) return NextResponse.json({ error: 'Forbidden. You do not have access to this workspace/brand.' }, { status: 403 })
    
    const brandId = brand.id`

  if (regex.test(content)) {
    content = content.replace(regex, secureBlock)
    fs.writeFileSync(filePath, content, 'utf8')
    console.log(`Fixed ${file}`)
  } else {
    // try matching single line without braces
    const regexSingleLine = /const\s+brandId\s*=\s*searchParams\.get\(['"]brandId['"]\)(?: as string)?[\s\S]*?if\s*\(!brandId\)\s*return\s+NextResponse\.json\([\s\S]*?\)/
    if (regexSingleLine.test(content)) {
      content = content.replace(regexSingleLine, secureBlock)
      fs.writeFileSync(filePath, content, 'utf8')
      console.log(`Fixed single line ${file}`)
    } else {
      console.log(`Could not fix ${file} automatically.`)
    }
  }
}
