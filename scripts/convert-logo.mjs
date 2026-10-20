import puppeteer from 'puppeteer'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

async function convertLogo() {
  const svgPath = path.join(rootDir, 'public', 'brand', 'logo_option2_arc_vault.svg')
  let svgContent = fs.readFileSync(svgPath, 'utf8')

  // Remove rx="112" so the solid dark background fills 100% edge-to-edge without white corners!
  const solidSvg = svgContent.replace('rx="112"', 'rx="0"')

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })

  try {
    const page = await browser.newPage()
    await page.setViewport({ width: 512, height: 512, deviceScaleFactor: 2 })

    const solidHtml = `<!DOCTYPE html><html><head><style>* { margin: 0; padding: 0; } body { width: 512px; height: 512px; overflow: hidden; background: #0B0F19; } svg { width: 512px; height: 512px; display: block; }</style></head><body>${solidSvg}</body></html>`

    await page.setContent(solidHtml, { waitUntil: 'domcontentloaded' })

    const outPng = path.join(rootDir, 'arcpact_logo.png')
    const outJpg = path.join(rootDir, 'arcpact_logo.jpg')
    const publicPng = path.join(rootDir, 'public', 'brand', 'arcpact_logo.png')
    const publicJpg = path.join(rootDir, 'public', 'brand', 'arcpact_logo.jpg')

    await page.screenshot({ path: outPng, type: 'png' })
    await page.screenshot({ path: outJpg, type: 'jpeg', quality: 98 })
    
    fs.copyFileSync(outPng, publicPng)
    fs.copyFileSync(outJpg, publicJpg)

    console.log('SUCCESS: Generated full-bleed logo without white edges!')
  } finally {
    await browser.close()
  }
}

convertLogo().catch(err => {
  console.error('Conversion failed:', err)
  process.exit(1)
})
