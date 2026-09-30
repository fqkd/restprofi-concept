export type CartLines = Record<string, number>

export function addItem(lines: CartLines, id: string, amount = 1): CartLines {
  return setItemCount(lines, id, (lines[id] || 0) + amount)
}

export function setItemCount(lines: CartLines, id: string, count: number): CartLines {
  const next = { ...lines }
  if (count > 0) next[id] = count
  else delete next[id]
  return next
}

export function itemCount(lines: CartLines): number {
  return Object.values(lines).reduce((sum, count) => sum + count, 0)
}

export function cartTotal(lines: CartLines, prices: Record<string, number>): number {
  return Object.entries(lines).reduce((sum, [id, count]) => sum + (prices[id] || 0) * count, 0)
}
