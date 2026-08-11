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

for (const routePath of allRoutes) {
  let content = fs.readFileSync(routePath, 'utf8')
  
  // Remove the strict brandIdParam check
  const strictCheck = /if\s*\(!brandIdParam\)\s*\{\s*return\s+NextResponse\.json\(\{\s*error:\s*['"]Missing brandId parameter['"]\s*\}\s*,\s*\{\s*status:\s*400\s*\}\)\s*\}/g
  const strictCheck2 = /if\s*\(!brandIdParam\)\s*return\s+NextResponse\.json\(\{\s*error:\s*['"]Missing brandId parameter['"]\s*\}\s*,\s*\{\s*status:\s*400\s*\}\)/g
  
  let modified = false
  if (strictCheck.test(content)) {
    content = content.replace(strictCheck, '')
    modified = true
  }
  if (strictCheck2.test(content)) {
    content = content.replace(strictCheck2, '')
    modified = true
  }

  if (modified) {
    fs.writeFileSync(routePath, content, 'utf8')
    console.log(`Removed strict brandId check in ${routePath}`)
  }
}
