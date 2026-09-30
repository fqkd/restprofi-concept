export type CartLines = Record<string, number>

export const lineKey = (id: string, note = '') => note.trim() ? `${id}::${encodeURIComponent(note.trim())}` : id
export const lineItemId = (key: string) => key.split('::')[0]
export const lineNote = (key: string) => {
  try { return key.includes('::') ? decodeURIComponent(key.split('::').slice(1).join('::')) : '' }
  catch { return '' }
}

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
  return Object.entries(lines).reduce((sum, [key, count]) => sum + (prices[lineItemId(key)] || 0) * count, 0)
}
