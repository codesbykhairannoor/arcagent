import puppeteer from 'puppeteer'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

async function convertLogo() {
  const svgPath = path.join(rootDir, 'public', 'brand', 'logo_option2_arc_vault.svg')
  const svgContent = fs.readFileSync(svgPath, 'utf8')

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })

  const page = await browser.newPage()
  await page.setViewport({ width: 512, height: 512, deviceScaleFactor: 2 })

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { width: 512px; height: 512px; overflow: hidden; background: transparent; }
          svg { width: 512px; height: 512px; display: block; }
        </style>
      </head>
      <body>
        ${svgContent}
      </body>
    </html>
  `

  await page.setContent(html, { waitUntil: 'networkidle0' })

  const outPng = path.join(rootDir, 'arcpact_logo.png')
  const outJpg = path.join(rootDir, 'arcpact_logo.jpg')
  const publicPng = path.join(rootDir, 'public', 'brand', 'arcpact_logo.png')
  const publicJpg = path.join(rootDir, 'public', 'brand', 'arcpact_logo.jpg')

  await page.screenshot({ path: outPng, type: 'png', omitBackground: true })
  await page.screenshot({ path: outJpg, type: 'jpeg', quality: 95 })
  
  fs.copyFileSync(outPng, publicPng)
  fs.copyFileSync(outJpg, publicJpg)

  await browser.close()
  console.log('SUCCESS: Generated logo PNG and JPG at 512x512 resolution!')
  console.log('PNG:', outPng)
  console.log('JPG:', outJpg)
}

convertLogo().catch(err => {
  console.error('Conversion failed:', err)
  process.exit(1)
})
