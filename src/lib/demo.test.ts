import test from 'node:test'
import assert from 'node:assert/strict'
import { addToCart, attemptPayment, initialDemoState, repeatOrder } from './demo.ts'

test('корзина сохраняется после первой ошибки оплаты', () => {
  const withDish = addToCart(initialDemoState)
  const attempt = attemptPayment(withDish)
  assert.equal(attempt.result, 'error')
  assert.equal(attempt.state.cartCount, 1)
})

test('повторная оплата завершается успешно и не очищает корзину раньше времени', () => {
  const withDish = addToCart(initialDemoState)
  const first = attemptPayment(withDish)
  const second = attemptPayment(first.state)
  assert.equal(second.result, 'success')
  assert.equal(second.state.cartCount, 1)
})

test('повтор заказа сообщает о недоступных позициях', () => {
  assert.deepEqual(repeatOrder(2, 3), { added: 2, unavailable: 1 })
})

