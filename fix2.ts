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
  
  // Replace the exact pattern
  const fixed = content.replace(/const brandId = brand\.id\s*\}/g, 'const brandId = brand.id')
  
  if (fixed !== content) {
    fs.writeFileSync(filePath, fixed, 'utf8')
    console.log(`Fixed brace in ${file}`)
  } else {
    console.log(`No match in ${file}`)
  }
}
