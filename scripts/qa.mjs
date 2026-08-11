import { chromium } from '@playwright/test'

const base = process.env.QA_BASE_URL || 'http://127.0.0.1:4173/restprofi-concept/'
const prototypeRoutes = [
  '#/', '#/order', '#/brand/pitcofe/format', '#/brand/mamadonna/menu', '#/product/gnocchi',
  '#/cart/pitcofe', '#/checkout/pitcofe', '#/payment-error', '#/booking',
  '#/booking/success', '#/cake', '#/cake/success', '#/repeat', '#/loyalty',
  '#/offers', '#/history', '#/search',
]
const prototypeSizes = [
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 1440, height: 1000 },
]
const caseSizes = [
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1440, height: 1000 },
]

const browser = await chromium.launch({ headless: true })
const errors = []

async function inspect(route, size) {
  const page = await browser.newPage({ viewport: size })
  page.on('console', (message) => {
    if (['error', 'warning'].includes(message.type())) errors.push(`${size.width}px ${route} console ${message.type()}: ${message.text()}`)
  })
  page.on('pageerror', (error) => errors.push(`${size.width}px ${route} pageerror: ${error.message}`))
  page.on('response', (response) => {
    if (response.status() >= 400) errors.push(`${size.width}px ${route} HTTP ${response.status()}: ${response.url()}`)
  })
  const response = await page.goto(new URL(route, base).href, { waitUntil: 'networkidle' })
  if (!response?.ok()) errors.push(`${size.width}px ${route} document HTTP ${response?.status() ?? 'none'}`)
  const state = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    rootEmpty: !document.querySelector('#root')?.textContent?.trim(),
  }))
  if (state.overflow) errors.push(`${size.width}px overflow: ${route}`)
  if (state.rootEmpty) errors.push(`${size.width}px empty root: ${route}`)
  await page.close()
}

for (const size of prototypeSizes) {
  for (const route of prototypeRoutes) await inspect(route, size)
}
for (const size of caseSizes) await inspect('case/', size)

const flow = await browser.newPage({ viewport: { width: 390, height: 844 } })
flow.on('console', (message) => {
  if (['error', 'warning'].includes(message.type())) errors.push(`flow console ${message.type()}: ${message.text()}`)
})
flow.on('pageerror', (error) => errors.push(`flow pageerror: ${error.message}`))

await flow.goto(new URL('#/', base).href)
await flow.evaluate(() => sessionStorage.clear())
await flow.reload()
await flow.getByRole('button', { name: /Заказать еду/ }).click()
await flow.getByRole('button', { name: /Питькофе/ }).click()
await flow.getByRole('button', { name: /Самовывоз/ }).click()
await flow.getByRole('button', { name: /Другая кофейня/ }).click()
await flow.getByRole('button', { name: /Смотреть доступное меню/ }).click()
await flow.getByRole('button', { name: /Открыть Ньокки/ }).click()
await flow.getByRole('button', { name: /Добавить ·/ }).click()
await flow.getByRole('button', { name: /К оформлению/ }).click()
await flow.getByRole('button', { name: /Подтвердить демозаказ/ }).click()
await flow.getByRole('heading', { name: 'Корзина на месте' }).waitFor()
await flow.reload()
await flow.getByRole('button', { name: 'Вернуться к оплате' }).click()
await flow.getByRole('button', { name: /Подтвердить демозаказ/ }).click()
await flow.getByRole('heading', { name: 'Заказ подтверждён' }).waitFor()

await flow.goto(new URL('#/booking', base).href)
await flow.getByRole('button', { name: /Питькофе/ }).click()
await flow.getByRole('button', { name: 'Завтра' }).click()
await flow.getByRole('button', { name: '20:00' }).click()
await flow.getByRole('button', { name: /Подтвердить демобронь/ }).click()
await flow.getByRole('heading', { name: /Питькофе завтра в 20:00/i }).waitFor()

await flow.goto(new URL('#/cake', base).href)
await flow.getByRole('button', { name: 'Детский' }).click()
await flow.getByRole('button', { name: /Оникс/ }).click()
await flow.getByRole('button', { name: /Дата · изменить/ }).click()
await flow.getByRole('button', { name: /Сформировать демозаявку/ }).click()
await flow.getByText(/Детский · «Оникс»/).waitFor()

await flow.goto(new URL('case/', base).href)
const caseUrl = flow.url()
const scenarioLinks = await flow.locator('a[href*="#/"]').evaluateAll((links) => links.map((link) => link.getAttribute('href')).filter(Boolean))
if (scenarioLinks.length < 6) errors.push(`case: expected at least 6 prototype links, got ${scenarioLinks.length}`)
for (const href of scenarioLinks) {
  const response = await flow.goto(new URL(href, caseUrl).href, { waitUntil: 'networkidle' })
  if (response && !response.ok()) errors.push(`case deep link HTTP ${response.status()}: ${href}`)
  if (!await flow.locator('#root').textContent()) errors.push(`case deep link empty root: ${href}`)
}
await flow.goto(caseUrl)
if (await flow.locator('a[href="mailto:hello@eh.works"]').count() !== 1) errors.push('case: mailto link is missing or duplicated')
if (await flow.locator('a[href="https://eh.works"]').count() !== 1) errors.push('case: eh.works link is missing or duplicated')
if (await flow.locator('a[href="https://t.me/andrey_ergohaven"]').count() !== 1) errors.push('case: Telegram link is missing or duplicated')
if (await flow.locator('a[href="https://max.ru/id5041212966_biz"]').count() !== 1) errors.push('case: MAX link is missing or duplicated')
const external = await flow.request.get('https://eh.works')
if (!external.ok()) errors.push(`eh.works HTTP ${external.status()}`)

await flow.close()
await browser.close()

if (errors.length) {
  console.error(errors.join('\n'))
  process.exit(1)
}
console.log(`QA: ${prototypeRoutes.length} prototype routes × ${prototypeSizes.length} viewports; case × ${caseSizes.length}; public-style order recovery, booking, cake and all case links passed`)
