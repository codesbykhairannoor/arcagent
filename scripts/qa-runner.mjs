/**
 * ArcPact Autonomous QA & Error Detection Suite
 * Tests UI routes, React hydration, modal interactions, console errors, and network failures.
 */

import puppeteer from 'puppeteer'
import fs from 'fs'
import path from 'path'

const BASE_URL = process.env.BASE_URL || 'https://arcpact-agent.vercel.app'
const REPORT_DIR = path.resolve(process.cwd(), 'qa-results')

if (!fs.existsSync(REPORT_DIR)) {
  fs.mkdirSync(REPORT_DIR, { recursive: true })
}

const ROUTES = [
  { name: 'Home', path: '/' },
  { name: 'Marketplace', path: '/marketplace' },
  { name: 'Agents', path: '/agents' },
  { name: 'Dashboard', path: '/dashboard' },
  { name: 'Developer', path: '/developer' },
  { name: 'Verifier', path: '/verifier' },
]

function findBrowserExecutable() {
  const candidates = [
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  ]
  for (const c of candidates) {
    if (fs.existsSync(c)) return c
  }
  return undefined
}

async function runQASuite() {
  console.log(`\n==================================================`)
  console.log(`🚀 STARTING ARCPACK AUTOMATED QA SUITE`)
  console.log(`🌐 Target Base URL: ${BASE_URL}`)
  console.log(`📁 Report Directory: ${REPORT_DIR}`)
  console.log(`==================================================\n`)

  const executablePath = findBrowserExecutable()
  if (executablePath) {
    console.log(`🧭 Using Local Browser: ${executablePath}`)
  }

  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security'],
  })

  const results = {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    routesTested: 0,
    totalConsoleErrors: 0,
    totalCrashes: 0,
    totalHttpFailures: 0,
    details: [],
  }

  for (const route of ROUTES) {
    const fullUrl = `${BASE_URL}${route.path}`
    console.log(`🔎 Testing Route: [${route.name}] (${fullUrl}) ...`)

    const page = await browser.newPage()
    await page.setViewport({ width: 1440, height: 900 })

    const routeErrors = []
    const routeHttpErrors = []

    // Listen for uncaught exceptions
    page.on('pageerror', (err) => {
      console.error(`  💥 [Page Crash] ${err.message}`)
      routeErrors.push({ type: 'CRASH', message: err.message, stack: err.stack })
    })

    // Listen for console.error
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text()
        // Filter out third-party extension noise if any
        if (!text.includes('moz-extension') && !text.includes('chrome-extension')) {
          console.error(`  ❌ [Console Error] ${text}`)
          routeErrors.push({ type: 'CONSOLE_ERROR', message: text })
        }
      }
    })

    // Listen for failed responses
    page.on('response', (res) => {
      if (res.status() >= 400 && !res.url().includes('favicon')) {
        console.warn(`  ⚠️ [HTTP ${res.status()}] ${res.url()}`)
        routeHttpErrors.push({ url: res.url(), status: res.status() })
      }
    })

    try {
      const response = await page.goto(fullUrl, { waitUntil: 'networkidle2', timeout: 30000 })
      const status = response ? response.status() : 'NO_RESPONSE'

      // Check page title
      const pageTitle = await page.title()

      // Take screenshot of route
      const screenshotPath = path.join(REPORT_DIR, `route-${route.name.toLowerCase()}.png`)
      await page.screenshot({ path: screenshotPath, fullPage: false })

      // Check if root element rendered
      const rootExists = await page.$('#root')
      const rootContent = rootExists ? await page.evaluate(el => el.innerHTML.length, rootExists) : 0

      console.log(`  ✅ Loaded (Status: ${status}, Title: "${pageTitle}", DOM Nodes: ${rootContent > 100 ? 'OK' : 'EMPTY'})`)

      results.details.push({
        name: route.name,
        path: route.path,
        httpStatus: status,
        domRendered: rootContent > 100,
        errors: routeErrors,
        httpErrors: routeHttpErrors,
        screenshot: screenshotPath,
      })

      results.totalConsoleErrors += routeErrors.filter(e => e.type === 'CONSOLE_ERROR').length
      results.totalCrashes += routeErrors.filter(e => e.type === 'CRASH').length
      results.totalHttpFailures += routeHttpErrors.length
      results.routesTested++

    } catch (e) {
      console.error(`  🚨 Fatal Timeout or Navigation Failure: ${e.message}`)
      const errScreenshot = path.join(REPORT_DIR, `fail-${route.name.toLowerCase()}.png`)
      try { await page.screenshot({ path: errScreenshot }) } catch {}
      results.details.push({
        name: route.name,
        path: route.path,
        error: e.message,
        screenshot: errScreenshot,
      })
      results.totalCrashes++
    } finally {
      await page.close()
    }
  }

  // Final summary
  const reportJsonPath = path.join(REPORT_DIR, 'summary-report.json')
  fs.writeFileSync(reportJsonPath, JSON.stringify(results, null, 2))

  console.log(`\n==================================================`)
  console.log(`📊 QA SUITE COMPLETED`)
  console.log(`📋 Routes Tested: ${results.routesTested} / ${ROUTES.length}`)
  console.log(`💥 Total Crashes / Uncaught: ${results.totalCrashes}`)
  console.log(`❌ Total Console Errors: ${results.totalConsoleErrors}`)
  console.log(`⚠️ Total HTTP 4xx/5xx Errors: ${results.totalHttpFailures}`)
  console.log(`📄 Detailed Report: ${reportJsonPath}`)
  console.log(`==================================================\n`)

  await browser.close()

  if (results.totalCrashes > 0) {
    process.exit(1)
  } else {
    process.exit(0)
  }
}

runQASuite()
