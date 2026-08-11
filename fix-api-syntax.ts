import fs from 'fs'
import path from 'path'

const files = [
  'src/app/api/actions/generate/route.ts',
  'src/app/api/actions/route.ts',
  'src/app/api/dashboard/route.ts',
  'src/app/api/meta-ads/route.ts',
  'src/app/api/products/route.ts'
]

for (const file of files) {
  const filePath = path.join(__dirname, file)
  if (!fs.existsSync(filePath)) continue
  let content = fs.readFileSync(filePath, 'utf8')
  
  content = content.replace(/const brandId = brand\.id,\s*\{\s*status:\s*400\s*\}\)/g, 'const brandId = brand.id')
  
  fs.writeFileSync(filePath, content, 'utf8')
  console.log(`Fixed syntax in ${file}`)
}
