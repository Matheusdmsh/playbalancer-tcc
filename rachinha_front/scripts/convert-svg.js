import fs from "fs"
import path from "path"
import { transform } from "@svgr/core"

const filePath = process.argv[2]
const outputPathArg = process.argv[3]

if (!filePath) {
  console.error("❌ Informe o caminho do SVG")
  process.exit(1)
}

const svgCode = fs.readFileSync(filePath, "utf-8")

function toPascalCase(value) {
  return value
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join("")
}

function getComponentNameFromPath(inputPath) {
  const folderName = path.basename(path.dirname(inputPath))
  const fromFolder = toPascalCase(folderName)

  if (fromFolder) {
    return `SvgCard${fromFolder}`
  }

  return "SvgCard"
}

function injectPhotoPlaceholder(svgContent) {
  const imageTagRegex = /<image\b[\s\S]*?>/gi
  const imageTags = svgContent.match(imageTagRegex) ?? []

  if (imageTags.length !== 1) {
    throw new Error(
      `Esperado exatamente 1 tag <image>, mas encontrei ${imageTags.length}.`
    )
  }

  const imageTag = imageTags[0]
  const hasHref = /\shref\s*=\s*"[^"]*"/i.test(imageTag)
  const hasXlinkHref = /\sxlink:href\s*=\s*"[^"]*"/i.test(imageTag)

  if (!hasHref && !hasXlinkHref) {
    throw new Error("A tag <image> nao possui href nem xlink:href.")
  }

  const widthMatch = imageTag.match(/\bwidth\s*=\s*"([0-9.]+)"/i)
  const squareSize = widthMatch?.[1] ?? "720"

  const replacedImageTag = imageTag
    .replace(/\bwidth\s*=\s*"[0-9.]+"/i, ` width="${squareSize}"`)
    .replace(/\bheight\s*=\s*"[0-9.]+"/i, ` height="${squareSize}"`)
    .replace(/\bpreserveAspectRatio\s*=\s*"[^"]*"/i, ' preserveAspectRatio="xMidYMid slice"')
    .replace(/\shref\s*=\s*"[^"]*"/i, ' href="__PHOTO_URL__"')
    .replace(/\sxlink:href\s*=\s*"[^"]*"/i, ' xlink:href="__PHOTO_URL__"')

  const normalizedImageTag = /\bpreserveAspectRatio\s*=\s*"[^"]*"/i.test(replacedImageTag)
    ? replacedImageTag
    : replacedImageTag.replace(/\/>$/, ' preserveAspectRatio="xMidYMid slice"/>')

  const withSquareImageTag = svgContent.replace(imageTag, normalizedImageTag)

  // Preserve fill behavior for 1:1 photos when source SVG came from portrait exports.
  return withSquareImageTag.replace(
    /matrix\(0\.00138889\s+0\s+0\s+0\.00140301\s+-0\.000583507\s+-0\.0329607\)/g,
    "matrix(0.00138889 0 0 0.00138889 0 0)"
  )
}

function withDynamicPhotoProp(componentCode) {
  const componentMatch = componentCode.match(
    /const\s+(\w+)\s*=\s*\(props(?:\s*:\s*[^)]*)?\)\s*=>/
  )

  if (!componentMatch) {
    throw new Error("Nao foi possivel identificar a assinatura do componente gerado.")
  }

  const generatedName = componentMatch[1]

  let withTyping = componentCode

  if (/import type \{ SVGProps \} from "react";?/.test(withTyping)) {
    withTyping = withTyping.replace(
      /import type \{ SVGProps \} from "react";?/,
      'import { useId, type SVGProps } from "react";'
    )
  } else if (!/import \{ useId, type SVGProps \} from "react";?/.test(withTyping)) {
    withTyping = `import { useId, type SVGProps } from \"react\"\n${withTyping}`
  }

  if (!/type SvgCardProps = SVGProps<SVGSVGElement> & \{/.test(withTyping)) {
    withTyping = withTyping.replace(
      /(import \{ useId, type SVGProps \} from "react";?\s*)/,
      `$1\ntype SvgCardProps = SVGProps<SVGSVGElement> & {\n  photoUrl: string\n}\n\n`
    )
  }

  const ids = Array.from(
    new Set(Array.from(withTyping.matchAll(/\bid="([^"]+)"/g)).map((m) => m[1]))
  )

  const idVarMap = new Map(ids.map((id, index) => [id, `svgId${index + 1}`]))
  const idVarDeclarations = [
    '  const uniqueId = useId().replace(/:/g, "")',
    ...ids.map((id) => `  const ${idVarMap.get(id)} = \`${id}-\${uniqueId}\``),
  ].join("\n")

  withTyping = withTyping.replace(
    /const\s+\w+\s*=\s*\(props(?:\s*:\s*[^)]*)?\)\s*=>\s*/,
    `const ${generatedName} = ({ photoUrl, ...props }: SvgCardProps) => {\n${idVarDeclarations}\n\n  return `
  )

  for (const [id, idVar] of idVarMap.entries()) {
    const escapedId = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

    withTyping = withTyping
      .replace(new RegExp(`id=\"${escapedId}\"`, "g"), `id={${idVar}}`)
      .replace(
        new RegExp(`=\"url\\(#${escapedId}\\)\"`, "g"),
        `={\`url(#\${${idVar}})\`}`
      )
      .replace(new RegExp(`xlinkHref=\"#${escapedId}\"`, "g"), `xlinkHref={\`#\${${idVar}}\`}`)
      .replace(new RegExp(`href=\"#${escapedId}\"`, "g"), `href={\`#\${${idVar}}\`}`)
  }

  withTyping = withTyping.replace(/<\/svg>;/, "</svg>\n};")

  return withTyping
    .replace(/(xlinkHref|href)="__PHOTO_URL__"/g, "$1={photoUrl}")
    .replace(
      new RegExp(`export default ${generatedName}`),
      `export { ${generatedName} }\nexport default ${generatedName}`
    )
}

async function run() {
  const componentName = getComponentNameFromPath(filePath)
  const outputPath =
    outputPathArg || path.join(path.dirname(filePath), "component.tsx")
  const svgWithPlaceholder = injectPhotoPlaceholder(svgCode)

  let jsxCode = await transform(
    svgWithPlaceholder,
    {
      plugins: ["@svgr/plugin-jsx"],
      jsxRuntime: "automatic",
      typescript: true,
      prettier: true,
      expandProps: "end",
    },
    { componentName }
  )

  jsxCode = withDynamicPhotoProp(jsxCode)

  fs.writeFileSync(outputPath, jsxCode)

  console.log("✅ SVG convertido corretamente:", outputPath)
}

run().catch((error) => {
  console.error("❌ Erro ao converter SVG:", error.message)
  process.exit(1)
})