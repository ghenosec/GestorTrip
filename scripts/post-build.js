const fs = require("fs")
const path = require("path")

const outDir = path.join(__dirname, "../out")

const subRoutes = fs
  .readdirSync(outDir)
  .filter((name) => {
    const full = path.join(outDir, name)
    return (
      fs.statSync(full).isDirectory() &&
      name !== "_next" &&
      fs.existsSync(path.join(full, "index.html"))
    )
  })

if (subRoutes.length === 0) {
  console.log("Nenhuma subrota encontrada, nada a fazer.")
  process.exit(0)
}

console.log(`Rotas encontradas: ${subRoutes.join(", ")}`)

const nextSrc = path.join(outDir, "_next")

function copyRecursive(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true })
  for (const item of fs.readdirSync(src)) {
    const srcPath = path.join(src, item)
    const destPath = path.join(dest, item)
    if (fs.statSync(srcPath).isDirectory()) {
      copyRecursive(srcPath, destPath)
    } else {
      fs.copyFileSync(srcPath, destPath)
    }
  }
}

for (const route of subRoutes) {
  const destNext = path.join(outDir, route, "_next")
  if (fs.existsSync(destNext)) {
    console.log(`  ✓ ${route}/_next já existe, pulando...`)
    continue
  }
  console.log(`  → Copiando _next para ${route}/...`)
  copyRecursive(nextSrc, destNext)
  console.log(`  ✓ ${route}/_next copiado`)
}

console.log("Post-build concluído.")