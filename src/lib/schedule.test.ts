import test from 'node:test'
import assert from 'node:assert/strict'
import { bookingDateOptions, cakeDateOptions, isFutureBookingTime, upcomingOrderIntervals } from './schedule.ts'

test('Krasnodar dates follow local midnight, including month boundaries', () => {
  const beforeLocalMidnight = new Date('2026-09-30T20:59:00Z')
  const afterLocalMidnight = new Date('2026-09-30T21:01:00Z')
  assert.deepEqual(cakeDateOptions(beforeLocalMidnight), ['3 октября', '4 октября'])
  assert.deepEqual(cakeDateOptions(afterLocalMidnight), ['4 октября', '5 октября'])
  assert.equal(bookingDateOptions(afterLocalMidnight)[2], '3 октября')
})

test('past booking times are disabled only for today', () => {
  const now = new Date('2026-09-30T16:06:00Z') // 19:06 in Krasnodar
  assert.equal(isFutureBookingTime('Сегодня', '19:00', now), false)
  assert.equal(isFutureBookingTime('Сегодня', '19:30', now), true)
  assert.equal(isFutureBookingTime('Завтра', '18:30', now), true)
  assert.equal(isFutureBookingTime('29 сентября', '20:00', now), false)
})

test('order intervals begin at least one hour ahead', () => {
  assert.deepEqual(upcomingOrderIntervals(new Date('2026-09-30T16:06:00Z')), [
    'Сегодня, 20:30–21:00', 'Сегодня, 21:00–21:30',
  ])
  assert.deepEqual(upcomingOrderIntervals(new Date('2026-09-30T20:40:00Z')), [
    'Завтра, 01:00–01:30', 'Завтра, 01:30–02:00',
  ])
})
