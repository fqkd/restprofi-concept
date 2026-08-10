export type BrandId = 'pitcofe' | 'mamadonna' | 'esttort' | 'cream'
export type Service = 'delivery' | 'pickup'

export interface DemoState {
  brand: BrandId
  service: Service
  cartCount: number
  paymentAttempts: number
}

export const initialDemoState: DemoState = {
  brand: 'pitcofe',
  service: 'delivery',
  cartCount: 0,
  paymentAttempts: 0,
}

export function addToCart(state: DemoState): DemoState {
  return { ...state, cartCount: state.cartCount + 1 }
}

export function attemptPayment(state: DemoState): { state: DemoState; result: 'error' | 'success' } {
  const paymentAttempts = state.paymentAttempts + 1
  return {
    state: { ...state, paymentAttempts },
    result: paymentAttempts === 1 ? 'error' : 'success',
  }
}

export function repeatOrder(availableItems: number, totalItems: number) {
  return {
    added: availableItems,
    unavailable: Math.max(0, totalItems - availableItems),
  }
}

