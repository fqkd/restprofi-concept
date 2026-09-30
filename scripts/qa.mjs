import { chromium } from '@playwright/test'
import { spawn } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'

const base = process.env.QA_BASE_URL || 'http://127.0.0.1:4173/restprofi-concept/'
const remoteBase = process.env.QA_BASE_URL
let preview
process.on('exit', () => {
  if (preview && !preview.killed) preview.kill('SIGTERM')
})

async function waitForServer(url) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(url)
      if (response.ok) return
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  throw new Error(`Сервер не ответил: ${url}`)
}

async function fetchExternal(url) {
  let lastError
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(15_000) })
    } catch (error) {
      lastError = error
    }
  }
  throw lastError
}

if (!remoteBase) {
  preview = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4173', '--strictPort'], { stdio: ['ignore', 'pipe', 'pipe'] })
  await waitForServer(base)
}
const prototypeRoutes = [
  '#/', '#/order', '#/brand/pitcofe', '#/brand/mamadonna', '#/brand/esttort', '#/brand/cream', '#/brand/cream/format', '#/brand/cream/menu', '#/brand/pitcofe/format', '#/brand/mamadonna/menu', '#/product/gnocchi', '#/product/burrata', '#/product/onyx',
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
  { width: 1366, height: 768 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
]

await mkdir('qa-output', { recursive: true })
const browser = await chromium.launch({ headless: true })
const errors = []
const report = { base, pages: [], scenarios: [] }

function screenshotName(route, size) {
  const routeName = route
    .replace(/^#\/?/, '')
    .replace(/\/$/, '')
    .replace(/[^a-z0-9]+/gi, '-') || 'home'
  return `qa-output/${routeName}-${size.width}x${size.height}.png`
}

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
  if (route.startsWith('#/product/')) {
    const expected = { gnocchi: 'Ньокки с говяжьими щёчками', burrata: 'Буррата с томатами', onyx: 'Торт «Оникс»' }[route.split('/').pop()]
    if (!await page.getByRole('heading', { name: expected }).count()) errors.push(`${size.width}px wrong product on deep link: ${route}`)
    const art = await page.locator('.product-art').boundingBox()
    const minimumWidth = size.width <= 430 ? size.width - 1 : 300
    if (!art || art.width < minimumWidth || art.height < 250) {
      errors.push(`${size.width}px product hero is missing or collapsed`)
    }
    const loaded = await page.locator('.product-art').evaluate((element) => element instanceof HTMLImageElement && element.complete && element.naturalWidth > 0)
    if (!loaded) errors.push(`${size.width}px product photo did not load: ${route}`)
  }
  await page.screenshot({ path: screenshotName(route, size), fullPage: true })
  report.pages.push({ route, ...size, status: response?.status(), ...state })
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
await flow.goto(new URL('#/profile', base).href)
await flow.getByLabel('Имя').fill('Алексей')
await flow.getByLabel('Телефон').fill('+7 900 123-45-67')
await flow.getByRole('button', { name: 'Сохранить контакты' }).click()
await flow.goto(new URL('#/', base).href)
await flow.getByRole('button', { name: /Заказать еду/ }).click()
await flow.getByRole('button', { name: /Питькофе/ }).click()
await flow.getByRole('button', { name: /Самовывоз/ }).click()
await flow.getByLabel('Поиск точки').fill('несуществующий адрес')
await flow.getByText('Ничего не найдено').waitFor()
await flow.getByLabel('Поиск точки').fill('Библиотека')
await flow.getByRole('button', { name: /Библиотека/ }).click()
await flow.context().grantPermissions(['geolocation'], { origin: new URL(base).origin })
await flow.context().setGeolocation({ latitude: 47.226, longitude: 39.721 })
await flow.getByRole('button', { name: /Рядом со мной/ }).click()
await flow.getByText('Расстояния рассчитаны от вашего положения').waitFor()
await flow.getByRole('button', { name: /Смотреть доступное меню/ }).click()
await flow.getByRole('button', { name: /Открыть Ньокки/ }).click()
await flow.getByLabel('Пожелание к блюду').fill('Без лука')
await flow.getByRole('button', { name: /Добавить ·/ }).click()
await flow.getByText('Пожелание: Без лука').waitFor()
await flow.getByRole('button', { name: /К оформлению/ }).click()
await flow.getByText(/Без лука/).waitFor()
if (await flow.getByLabel('Имя').inputValue() !== 'Алексей') errors.push('profile: saved name did not reach checkout')
if (await flow.getByLabel('Телефон').inputValue() !== '+7 900 123-45-67') errors.push('profile: saved phone did not reach checkout')
await flow.getByRole('button', { name: /Подтвердить заказ/ }).click()
await flow.getByRole('heading', { name: 'Корзина на месте' }).waitFor()
await flow.reload()
await flow.getByRole('button', { name: 'Вернуться к оплате' }).click()
await flow.getByRole('button', { name: /Подтвердить заказ/ }).click()
await flow.getByRole('heading', { name: 'Заказ подтверждён' }).waitFor()
report.scenarios.push({ name: 'заказ → ошибка оплаты → восстановление', status: 'passed' })

await flow.getByRole('button', { name: 'История заказов' }).click()
await flow.getByRole('heading', { name: 'Ваши заказы' }).waitFor()
if (await flow.locator('.history-card').count() !== 1) errors.push('history: successful order was not recorded')
await flow.getByRole('button', { name: /Повторить/ }).click()
await flow.getByRole('button', { name: 'Проверить и повторить' }).click()
await flow.getByRole('button', { name: 'Открыть корзину' }).click()
await flow.getByText('Ньокки с говяжьими щёчками').waitFor()
await flow.getByText('Пожелание: Без лука').waitFor()
report.scenarios.push({ name: 'успешный заказ → история → повтор', status: 'passed' })

await flow.goto(new URL('#/booking', base).href)
await flow.getByRole('button', { name: /Питькофе/ }).click()
await flow.getByRole('button', { name: 'Завтра' }).click()
await flow.getByRole('button', { name: '20:00' }).click()
await flow.getByRole('button', { name: /Сохранить запрос/ }).click()
await flow.getByRole('heading', { name: /Питькофе завтра в 20:00/i }).waitFor()
report.scenarios.push({ name: 'бронирование → подтверждение', status: 'passed' })

await flow.goto(new URL('#/cake', base).href)
await flow.getByRole('button', { name: 'Детский' }).click()
await flow.getByRole('button', { name: /Оникс/ }).click()
await flow.getByRole('button', { name: /Дата · изменить/ }).click()
await flow.getByRole('button', { name: /Сохранить заявку/ }).click()
await flow.getByText(/Детский · «Оникс»/).waitFor()
report.scenarios.push({ name: 'торт → заявка', status: 'passed' })

await flow.goto(new URL('#/loyalty', base).href)
if (await flow.getByRole('link', { name: 'Страница приложения' }).getAttribute('href') !== 'https://apps.apple.com/ru/app/id1608159331') errors.push('loyalty: wrong Pitcofe link')
await flow.getByRole('button', { name: 'MamaDonna' }).click()
if (await flow.getByRole('link', { name: 'Условия программы' }).getAttribute('href') !== 'https://mamadonna.ru/bonuses/') errors.push('loyalty: wrong MamaDonna link')
report.scenarios.push({ name: 'лояльность → выбор бренда → официальные условия', status: 'passed' })

await flow.goto(new URL('#/brand/pitcofe/menu', base).href)
await flow.getByRole('button', { name: 'Супы', exact: true }).click()
await flow.getByText('Борщ с говядиной').waitFor()
if (await flow.getByText('Карбонара').count()) errors.push('menu: soups include pasta')
await flow.getByRole('button', { name: 'Все блюда' }).click()
await flow.getByText('Карбонара').waitFor()
await flow.evaluate(() => sessionStorage.clear())
await flow.reload()
await flow.getByRole('button', { name: 'Добавить Ньокки с говяжьими щёчками' }).click()
await flow.getByRole('button', { name: 'Добавить Карбонара' }).click()
await flow.goto(new URL('#/cart/pitcofe', base).href)
if (await flow.locator('.cart-item').count() !== 2) errors.push('cart: adding a second dish replaced the first')
if (await flow.locator('.cart-item img').count() !== 2 || !await flow.locator('.cart-item img').evaluateAll((images) => images.every((image) => image.complete && image.naturalWidth > 0))) errors.push('cart: dish photos missing')
await flow.getByRole('button', { name: 'Уменьшить Ньокки с говяжьими щёчками' }).click()
if (await flow.locator('.cart-item').count() !== 1) errors.push('cart: removing one dish changed the other')
await flow.getByText('Карбонара').waitFor()
await flow.getByRole('button', { name: /К оформлению/ }).click()
await flow.getByLabel('Имя').fill('Алексей')
await flow.getByLabel('Телефон').fill('+7 900 123-45-67')
await flow.locator('.checkout-order').first().waitFor()
if (await flow.locator('.checkout-order').count() !== 1) errors.push('checkout: cart lines do not match the order')
if (!await flow.locator('.checkout-order img').first().evaluate((image) => image.complete && image.naturalWidth > 0)) errors.push('checkout: dish photo missing')
report.scenarios.push({ name: 'два блюда → удаление одного → оформление', status: 'passed' })

await flow.goto(new URL('#/brand/cream', base).href)
await flow.getByRole('button', { name: /Что известно о Cream/ }).click()
await flow.getByRole('heading', { name: 'Заказ пока недоступен' }).waitFor()
if (await flow.getByRole('button', { name: 'Меню' }).isEnabled()) errors.push('Cream: неподтверждённое меню доступно из навигации')
await flow.goto(new URL('#/brand/cream/menu', base).href)
await flow.getByRole('heading', { name: 'Заказ пока недоступен' }).waitFor()
await flow.goto(new URL('#/', base).href)
await flow.getByText('Адрес и заказ пока не подтверждены').waitFor()
report.scenarios.push({ name: 'Cream не открывает неподтверждённый заказ', status: 'passed' })

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
const external = await fetchExternal('https://eh.works')
if (!external.ok) errors.push(`eh.works HTTP ${external.status}`)

await flow.close()
await browser.close()
if (preview) preview.kill('SIGTERM')
await writeFile('qa-output/report.json', JSON.stringify(report, null, 2))

if (errors.length) {
  console.error(errors.join('\n'))
  process.exit(1)
}
console.log(`QA: ${prototypeRoutes.length} prototype routes × ${prototypeSizes.length} viewports; case at 1366x768, 1440x900 and 1920x1080; screenshots, order recovery, booking, cake and all case links passed`)
