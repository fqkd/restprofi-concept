import { expect, test } from '@playwright/test'

test('заказ сохраняется после ошибки и завершается со второй попытки', async ({ page }) => {
  await page.goto('#/brand/pitcofe/format')
  await page.getByRole('button', { name: /Смотреть доступное меню/ }).click()
  await page.getByRole('button', { name: /Открыть Ньокки/ }).click()
  await page.getByRole('button', { name: /Добавить ·/ }).click()
  await page.getByRole('button', { name: /К оформлению/ }).click()
  await page.getByRole('button', { name: /Подтвердить демозаказ/ }).click()
  await expect(page.getByRole('heading', { name: 'Корзина на месте' })).toBeVisible()
  await page.getByRole('button', { name: 'Вернуться к оплате' }).click()
  await page.getByRole('button', { name: /Подтвердить демозаказ/ }).click()
  await expect(page.getByRole('heading', { name: 'Заказ подтверждён' })).toBeVisible()
})

test('бронирование доходит до подтверждения', async ({ page }) => {
  await page.goto('#/booking')
  await page.getByRole('button', { name: /Подтвердить демобронь/ }).click()
  await expect(page.getByText('Код демоброни')).toBeVisible()
})

test('заказ торта формирует отдельную демозаявку', async ({ page }) => {
  await page.goto('#/cake')
  await page.getByRole('button', { name: /Сформировать демозаявку/ }).click()
  await expect(page.getByText('Демозаявка')).toBeVisible()
})

test('презентация и ключевые deep links открываются напрямую', async ({ page }) => {
  await page.goto('case/')
  await expect(page.getByRole('heading', { name: /Сначала задача/ })).toBeVisible()
  const hrefs = await page.locator('a[href*="#/"]').evaluateAll((links) => links.map((link) => link.getAttribute('href')))
  expect(hrefs.length).toBeGreaterThanOrEqual(6)
  await page.goto('#/repeat')
  await expect(page.getByRole('heading', { name: /Почти как/ })).toBeVisible()
})
