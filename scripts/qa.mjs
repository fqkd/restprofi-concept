import { chromium } from '@playwright/test'

const base = process.env.QA_BASE_URL || 'http://127.0.0.1:4173/restprofi-concept/'
const routes = ['#/', '#/brand/pitcofe/format', '#/brand/pitcofe/menu', '#/booking', '#/cake', '#/repeat', 'case/']
const sizes = [
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 768, height: 1024 },
  { width: 1440, height: 1000 },
]

const browser = await chromium.launch({ headless: true })
const errors = []
for (const size of sizes) {
  const page = await browser.newPage({ viewport: size })
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`${size.width}px console: ${message.text()}`)
  })
  page.on('pageerror', (error) => errors.push(`${size.width}px pageerror: ${error.message}`))
  for (const route of routes) {
    await page.goto(new URL(route, base).href, { waitUntil: 'networkidle' })
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)
    if (overflow) errors.push(`${size.width}px overflow: ${route}`)
  }
  await page.close()
}
await browser.close()
if (errors.length) {
  console.error(errors.join('\n'))
  process.exit(1)
}
console.log(`QA: ${routes.length} routes × ${sizes.length} viewports, no console errors or horizontal overflow`)

