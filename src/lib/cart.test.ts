import test from 'node:test'
import assert from 'node:assert/strict'
import { addItem, cartTotal, itemCount, setItemCount } from './cart.ts'

test('different dishes remain separate and totals use each price', () => {
  const lines = addItem(addItem(addItem({}, 'carbonara'), 'borsch'), 'carbonara')
  assert.deepEqual(lines, { carbonara: 2, borsch: 1 })
  assert.equal(itemCount(lines), 3)
  assert.equal(cartTotal(lines, { carbonara: 529, borsch: 529 }), 1587)
})

test('removing one dish preserves the other dish', () => {
  const lines = setItemCount({ carbonara: 2, borsch: 1 }, 'carbonara', 0)
  assert.deepEqual(lines, { borsch: 1 })
})
