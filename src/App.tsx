import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft, ArrowRight, CalendarDays, CakeSlice, Check,
  ChevronRight, CircleAlert, Clock3, Coffee, CreditCard, History,
  Home, IceCreamBowl, MapPin, Minus, PackageCheck, Plus, Search, ShoppingBag,
  Sparkles, Store, TicketCheck, Truck, UserRound, UsersRound, UtensilsCrossed,
} from 'lucide-react'
import { LocationMap } from './LocationMap'
import { locationsByBrand } from './locations'
import { bookingDateOptions, isFutureBookingTime, upcomingOrderIntervals } from './lib/schedule'
import { addItem, cartTotal, itemCount, lineItemId, lineKey, lineNote, setItemCount, type CartLines } from './lib/cart'

type BrandId = 'pitcofe' | 'mamadonna' | 'esttort' | 'cream'
type Service = 'delivery' | 'pickup'
type BrandContext = { service: Service; address: string }
type BookingRequest = {
  id: string
  brand: 'pitcofe' | 'mamadonna'
  dateISO: string
  time: string
  guests: number
  locationId: string
  name: string
  phone: string
  createdAt: string
}
type CakeRequest = {
  id: string
  kind: string
  filling: string
  weight: string
  dateISO: string
  service: Service
  address: string
  name: string
  phone: string
  note: string
  createdAt: string
}
type Order = {
  id: string
  brand: BrandId
  service: Service
  address: string
  createdAt: string
  lines: CartLines
  total: number
  time?: string
  payment?: string
}

type Session = {
  brand: BrandId
  service: Service
  cart: Record<BrandId, CartLines>
  paymentFailed: boolean
  address: string
  contexts: Record<BrandId, BrandContext>
  checkoutTime: string
  checkoutPayment: string
  orders: Order[]
  repeatOrderId: string | null
  profile: { name: string; phone: string }
  booking: {
    brand: 'pitcofe' | 'mamadonna'
    date: string
    time: string
    guests: number
    locationId: string
    name: string
    phone: string
  }
  bookings: BookingRequest[]
  activeBookingId: string | null
  cake: {
    kind: string
    filling: string
    weight: string
    date: string
    service: Service
    address: string
    name: string
    phone: string
    note: string
  }
  cakeRequests: CakeRequest[]
  activeCakeId: string | null
}

const brands: Record<BrandId, { name: string; note: string; tone: string }> = {
  pitcofe: { name: 'Питькофе', note: 'кофейни · доставка · навынос', tone: 'amber' },
  mamadonna: { name: 'MamaDonna', note: 'гастрокафе · заказ в кафе · доставка', tone: 'tomato' },
  esttort: { name: 'ЕстьТорт', note: 'торты на заказ · каталог начинок', tone: 'berry' },
  cream: { name: 'Cream', note: 'кондитерская · десерты в витрине', tone: 'cream' },
}

const brandExperience: Record<BrandId, { eyebrow: string; title: string; description: string }> = {
  pitcofe: { eyebrow: 'Питькофе · кофейня', title: 'Завтрак, обед\nи кофе с собой', description: 'Выберите доставку или самовывоз. Меню откроется для выбранного формата.' },
  mamadonna: { eyebrow: 'MamaDonna · гастрокафе', title: 'Повод встретиться\nза столом', description: 'Забронируйте столик или выберите блюда для заказа.' },
  esttort: { eyebrow: 'ЕстьТорт · кондитерская', title: 'Торт к вашему\nпразднику', description: 'Выберите начинку, вес и дату. Кондитер подтвердит детали заказа.' },
  cream: { eyebrow: 'Cream · кондитерская', title: 'Витрина\nдесертов', description: 'Адрес точки и ассортимент витрины пока не подтверждены.' },
}

type DishCategory = 'main' | 'soup' | 'salad' | 'breakfast' | 'dessert' | 'cake'
const categoryLabels: Record<DishCategory, string> = { main: 'Основное', soup: 'Супы', salad: 'Салаты', breakfast: 'Завтраки', dessert: 'Десерты', cake: 'Торты' }
const dishes: Record<BrandId, Array<{ id: string; title: string; meta: string; price: number; art: string; category: DishCategory }>> = {
  pitcofe: [
    { id: 'gnocchi', title: 'Ньокки с говяжьими щёчками', meta: 'Основное блюдо · 390 г', price: 649, art: 'art-sage', category: 'main' },
    { id: 'carbonara', title: 'Карбонара', meta: 'Паста · 320 г', price: 529, art: 'art-sun', category: 'main' },
    { id: 'borsch', title: 'Борщ с говядиной', meta: 'Суп · 350 г', price: 529, art: 'art-red', category: 'soup' },
  ],
  mamadonna: [
    { id: 'burrata', title: 'Буррата с томатами', meta: 'Салат · 250 г', price: 660, art: 'art-red', category: 'salad' },
    { id: 'omelette', title: 'Омлет с креветками и авокадо', meta: 'Завтрак · 315 г', price: 650, art: 'art-sage', category: 'breakfast' },
    { id: 'napoleon', title: 'Наполеон', meta: 'Десерт · 150 г', price: 320, art: 'art-sun', category: 'dessert' },
  ],
  esttort: [
    { id: 'sebastian', title: 'Чизкейк «Сан-Себастьян»', meta: 'от 1,6 кг', price: 2205, art: 'art-sun', category: 'cake' },
    { id: 'onyx', title: 'Торт «Оникс»', meta: 'от 1,4 кг', price: 2709, art: 'art-berry', category: 'cake' },
    { id: 'bento', title: 'Бенто-торт', meta: 'от 0,37 кг', price: 1365, art: 'art-pink', category: 'cake' },
  ],
  cream: [
    { id: 'showcase', title: 'Витрина десертов', meta: 'ассортимент уточняется в точке', price: 0, art: 'art-cream', category: 'dessert' },
  ],
}

const emptyCart = (): Record<BrandId, CartLines> => ({ pitcofe: {}, mamadonna: {}, esttort: {}, cream: {} })
const prices = (brand: BrandId) => Object.fromEntries(dishes[brand].map((item) => [item.id, item.price]))
const cartEntries = (session: Session, brand: BrandId) => Object.entries(session.cart[brand])
  .filter(([, count]) => count > 0)
  .map(([key, count]) => ({ key, item: dishes[brand].find((dish) => dish.id === lineItemId(key)), note: lineNote(key), count }))
  .filter((line): line is { key: string; item: (typeof dishes)[BrandId][number]; note: string; count: number } => Boolean(line.item))

const demoDeliveryAddresses = ['ул. Пушкинская, 120А', 'просп. Соколова, 45']
const pickupLocations: Record<BrandId, string[]> = Object.fromEntries(
  Object.entries(locationsByBrand).map(([brand, locations]) => [brand, locations.map((location) => location.address)]),
) as Record<BrandId, string[]>
const defaultContexts = (): Record<BrandId, BrandContext> => Object.fromEntries(
  (Object.keys(brands) as BrandId[]).map((brand) => [brand, { service: 'delivery', address: demoDeliveryAddresses[0] }]),
) as Record<BrandId, BrandContext>

const initialSession: Session = {
  brand: 'pitcofe',
  service: 'delivery',
  cart: emptyCart(),
  paymentFailed: false,
  address: 'ул. Пушкинская, 120А',
  contexts: defaultContexts(),
  checkoutTime: 'Ближайшее время',
  checkoutPayment: 'Банковская карта',
  orders: [],
  repeatOrderId: null,
  profile: { name: '', phone: '' },
  booking: { brand: 'mamadonna', date: 'Сегодня', time: '19:30', guests: 2, locationId: 'mama-center', name: '', phone: '' },
  bookings: [],
  activeBookingId: null,
  cake: { kind: 'Праздничный', filling: 'Чёрный лес', weight: '2 кг', date: bookingDateISO('Сегодня', new Date(), 3), service: 'pickup', address: locationsByBrand.esttort[0].address, name: '', phone: '', note: '' },
  cakeRequests: [],
  activeCakeId: null,
}

function readSession(): Session {
  try {
    const saved = JSON.parse(sessionStorage.getItem('restprofi-demo-v2') || '{}')
    const stored = { ...initialSession, ...saved }
    const oldCart = stored.cart as Record<BrandId, number | CartLines>
    stored.cart = Object.fromEntries((Object.keys(brands) as BrandId[]).map((brand) => {
      const value = oldCart?.[brand]
      const item = stored.cartItem?.[brand] || dishes[brand][0].id
      return [brand, typeof value === 'number' ? (value > 0 ? { [item]: value } : {}) : (value || {})]
    })) as Record<BrandId, CartLines>
    delete stored.cartItem
    if (!Array.isArray(stored.orders)) stored.orders = []
    const contexts = { ...defaultContexts(), ...saved.contexts }
    if (!saved.contexts && stored.brand in brands) contexts[stored.brand as BrandId] = { service: stored.service, address: stored.address }
    for (const brand of Object.keys(brands) as BrandId[]) {
      const context = contexts[brand]
      if (context.service === 'pickup' && !pickupLocations[brand].includes(context.address)) contexts[brand] = { service: 'pickup', address: pickupLocations[brand][0] ?? '' }
      if (context.service === 'delivery' && !context.address?.trim()) contexts[brand] = { service: 'delivery', address: demoDeliveryAddresses[0] }
    }
    stored.contexts = contexts
    const activeContext = contexts[stored.brand as BrandId] ?? contexts.pitcofe
    stored.service = activeContext.service
    stored.address = activeContext.address
    stored.profile = { ...initialSession.profile, ...stored.profile }
    stored.booking = { ...initialSession.booking, ...stored.booking }
    const savedBookings = JSON.parse(localStorage.getItem('restprofi-demo-bookings') || '[]')
    stored.bookings = Array.isArray(savedBookings) ? savedBookings : []
    if (!stored.bookings.some((request: BookingRequest) => request.id === stored.activeBookingId)) stored.activeBookingId = null
    stored.cake = { ...initialSession.cake, ...stored.cake }
    const savedCakes = JSON.parse(localStorage.getItem('restprofi-demo-cakes') || '[]')
    stored.cakeRequests = Array.isArray(savedCakes) ? savedCakes : []
    if (!stored.cakeRequests.some((request: CakeRequest) => request.id === stored.activeCakeId)) stored.activeCakeId = null
    if (!/^\d{4}-\d{2}-\d{2}$/.test(stored.cake.date)) stored.cake.date = initialSession.cake.date
    stored.checkoutTime ||= initialSession.checkoutTime
    stored.checkoutPayment ||= initialSession.checkoutPayment
    if (!bookingDateOptions().includes(stored.booking?.date)) stored.booking.date = 'Сегодня'
    if (stored.address?.includes('· демо')) stored.address = stored.address.replace(' · демо', '').replace('Пушкинская, 120', 'Пушкинская, 120А')
    return stored
  } catch {
    return initialSession
  }
}

function currentRoute() {
  return window.location.hash.replace(/^#/, '').split('?')[0] || '/'
}

function routeBrand(route: string): BrandId | null {
  if (route.startsWith('/product/')) {
    const productId = route.split('/')[2]
    return (Object.keys(dishes) as BrandId[]).find((id) => dishes[id].some((item) => item.id === productId)) || null
  }
  return (Object.keys(brands) as BrandId[]).find((id) => route.includes(`/${id}`)) || null
}

export function App() {
  const [route, setRoute] = useState(currentRoute)
  const [session, setSession] = useState<Session>(readSession)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const onHash = () => setRoute(currentRoute())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    const fromRoute = routeBrand(route)
    if (fromRoute && fromRoute !== session.brand) {
      setSession((value) => ({
        ...value,
        brand: fromRoute,
        ...value.contexts[fromRoute],
        paymentFailed: false,
      }))
    }
  }, [route, session.brand])

  useEffect(() => sessionStorage.setItem('restprofi-demo-v2', JSON.stringify(session)), [session])
  useEffect(() => localStorage.setItem('restprofi-demo-bookings', JSON.stringify(session.bookings)), [session.bookings])
  useEffect(() => localStorage.setItem('restprofi-demo-cakes', JSON.stringify(session.cakeRequests)), [session.cakeRequests])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
    document.querySelector<HTMLElement>('.phone-content')?.scrollTo({ top: 0, behavior: 'instant' })
  }, [route])

  const go = (next: string) => {
    if (next === '/booking' && (route.startsWith('/brand/pitcofe') || route.startsWith('/brand/mamadonna'))) {
      const brand = route.startsWith('/brand/pitcofe') ? 'pitcofe' : 'mamadonna'
      setSession((value) => ({ ...value, booking: { ...value.booking, brand, locationId: locationsByBrand[brand][0].id }, activeBookingId: null }))
    }
    window.location.hash = next
    window.scrollTo({ top: 0, behavior: 'instant' })
  }
  const update = (patch: Partial<Session>) => setSession((value) => {
    const brand = patch.brand ?? value.brand
    if (brand !== value.brand) return { ...value, ...patch, brand, ...value.contexts[brand], paymentFailed: false }
    const service = patch.service ?? value.service
    const address = patch.address ?? value.address
    return { ...value, ...patch, contexts: { ...value.contexts, [brand]: { service, address } } }
  })
  const cartCount = itemCount(session.cart[session.brand])

  const page = useMemo(() => {
    const requestedBrand = routeBrand(route)
    if (requestedBrand && requestedBrand !== session.brand) return null
    if (route === '/') return <HomeScreen go={go} session={session} update={update} />
    if (route === '/order') return <OrderBrandScreen go={go} session={session} update={update} />
    if (route === '/search') return <SearchScreen go={go} session={session} />
    if (route === '/loyalty') return <LoyaltyScreen go={go} />
    if (route === '/history') return <HistoryScreen go={go} session={session} update={update} />
    if (route === '/profile') return <ProfileScreen go={go} session={session} update={update} />
    if (route === '/offers') return <OffersScreen go={go} />
    if (route === '/booking') return <BookingScreen go={go} session={session} update={update} />
    if (route === '/booking/success') return <BookingSuccess go={go} session={session} />
    if (route === '/cake') return <CakeScreen go={go} session={session} update={update} />
    if (route === '/cake/success') return <CakeSuccess go={go} session={session} />
    if (route === '/repeat') return <RepeatScreen go={go} session={session} update={update} />
    if (route === '/payment-error') return session.paymentFailed && itemCount(session.cart[session.brand]) > 0 ? <PaymentError go={go} session={session} /> : <UnavailableCheckout go={go} />
    if (route === '/order/success') return <OrderSuccess go={go} session={session} />
    if (session.brand === 'cream' && (route === '/brand/cream/format' || route === '/brand/cream/menu' || route.startsWith('/cart/cream') || route.startsWith('/checkout/cream') || route === '/product/showcase')) return <CreamInfoScreen go={go} />
    if (route.startsWith('/brand/') && route.endsWith('/format')) return <FormatScreen go={go} session={session} update={update} />
    if (route.startsWith('/brand/') && route.endsWith('/menu')) return <MenuScreen go={go} session={session} update={update} />
    if (route.startsWith('/brand/')) return <BrandScreen go={go} session={session} />
    if (route.startsWith('/product/')) return <ProductScreen go={go} session={session} update={update} productId={route.split('/').pop() || ''} />
    if (route.startsWith('/cart/')) return <CartScreen go={go} session={session} update={update} />
    if (route.startsWith('/checkout/')) return itemCount(session.cart[session.brand]) > 0 ? <CheckoutScreen go={go} session={session} update={update} loading={loading} setLoading={setLoading} /> : <UnavailableCheckout go={go} brand={session.brand} />
    return <NotFound go={go} />
  }, [route, session, loading])

  return (
    <div className="app-stage">
      <aside className="desktop-story">
        <div className="story-mark"><span>RP</span> RestProfi</div>
        <p className="story-kicker">Одна точка входа.<br />Разные характеры брендов.</p>
        <p className="story-copy">Выберите задачу, затем оставайтесь внутри выбранного ресторана — без смешанной корзины.</p>
        <a href="./case/" className="story-link">Открыть презентацию <ArrowRight size={17} /></a>
        <div className="story-orbit" aria-hidden="true"><i /><i /><i /></div>
      </aside>
      <main className="phone-shell">
        <div className="phone-top"><span>12:42</span><span className="dynamic-island" /><span>5G&nbsp; ◉</span></div>
        <div className="phone-content">{page}</div>
        {!['/booking/success', '/cake/success', '/order/success'].includes(route) && (
          <BottomNav route={route} go={go} cartCount={cartCount} brand={session.brand} />
        )}
      </main>
    </div>
  )
}

type Go = (path: string) => void

function ScreenHeader({ title, go, back = '/' }: { title: string; go: Go; back?: string }) {
  return <header className="screen-header"><button aria-label="Назад" onClick={() => go(back)}><ArrowLeft /></button><strong>{title}</strong><span /></header>
}

function BrandMark({ id, small = false }: { id: BrandId; small?: boolean }) {
  const brand = brands[id]
  const glyph = id === 'pitcofe' ? <Coffee /> : id === 'mamadonna' ? <UtensilsCrossed /> : id === 'esttort' ? <CakeSlice /> : <IceCreamBowl />
  return <span className={`brand-mark ${brand.tone} ${small ? 'small' : ''}`} aria-hidden="true">{glyph}</span>
}

function DishArt({ item, large = false }: { item: { id: string; title: string; art: string }; large?: boolean }) {
  if (item.id !== 'showcase') return <img className={`${large ? 'product-art' : 'dish-art'} ${item.art} photo`} src={`${import.meta.env.BASE_URL}dishes/${item.id}.webp`} alt="" loading="lazy" />
  const icon = /торт|чизкейк|наполеон|бенто/i.test(item.title) ? <CakeSlice /> : /витрина/i.test(item.title) ? <IceCreamBowl /> : /омлет|буррата/i.test(item.title) ? <Sparkles /> : <UtensilsCrossed />
  return <span className={`${large ? 'product-art' : 'dish-art'} ${item.art}`} aria-hidden="true"><span className="food-plate">{icon}</span></span>
}

function MiniDishArt({ item }: { item: { id: string; art: string } }) {
  if (item.id === 'showcase') return <span className={`mini-art ${item.art}`} aria-hidden="true"><IceCreamBowl /></span>
  return <img className="mini-art photo" src={`${import.meta.env.BASE_URL}dishes/${item.id}.webp`} alt="" loading="lazy" />
}

function HomeScreen({ go, session, update }: { go: Go; session: Session; update: (p: Partial<Session>) => void }) {
  const pick = (id: BrandId) => {
    update({ brand: id })
    go(`/brand/${id}`)
  }
  return <div className="screen home-screen">
    <div className="home-heading"><div><p className="eyebrow">Добрый день</p><h1>Что хочется<br />сегодня?</h1></div><button className="avatar" aria-label="Профиль" onClick={() => go('/profile')}><UserRound /></button></div>
    <button className="context-card" onClick={() => go(`/brand/${session.brand}/format`)}>
      <MapPin /><span><b>{session.brand === 'cream' ? 'Что известно о Cream' : session.service === 'delivery' ? 'Проверить доставку' : 'Изменить самовывоз'}</b><small>{session.brand === 'cream' ? 'Адрес и заказ пока не подтверждены' : session.address}</small></span><ChevronRight />
    </button>
    <div className="task-grid">
      <button className="task task-order" onClick={() => go('/order')}><ShoppingBag /><b>Заказать еду</b><span>сначала бренд, затем формат</span></button>
      <button className="task task-book" onClick={() => go('/booking')}><CalendarDays /><b>Забронировать</b><span>дата, время, гости</span></button>
      <button className="task task-cake" onClick={() => go('/cake')}><CakeSlice /><b>Выбрать торт</b><span>отдельный заказ</span></button>
    </div>
    <div className="section-title"><h2>Выберите бренд</h2><button onClick={() => go('/offers')}>Для вас</button></div>
    <div className="brand-stack">
      {(Object.keys(brands) as BrandId[]).map((id) => <button className={`brand-row brand-${brands[id].tone}`} key={id} onClick={() => pick(id)}><BrandMark id={id} /><span><b>{brands[id].name}</b><small>{brands[id].note}</small></span><ChevronRight /></button>)}
    </div>
    <button className="loyalty-strip" onClick={() => go('/loyalty')}><span><TicketCheck /><b>Карты лояльности</b></span><small>Каждый бренд — по своим правилам</small><ChevronRight /></button>
  </div>
}

function OrderBrandScreen({ go, session, update }: { go: Go; session: Session; update: (p: Partial<Session>) => void }) {
  const select = (brand: 'pitcofe' | 'mamadonna') => {
    update({ brand })
    go(`/brand/${brand}/format`)
  }
  return <div className="screen order-brand-screen"><ScreenHeader title="Заказ еды" go={go} /><p className="step">01 / Бренд</p><h1>Где хотите<br />сделать заказ?</h1><p className="lead">Меню, условия и корзина останутся внутри выбранного бренда.</p><div className="brand-stack order-brand-list">{(['pitcofe', 'mamadonna'] as const).map((id) => <button className={`brand-row brand-${brands[id].tone}`} key={id} onClick={() => select(id)}><BrandMark id={id} /><span><b>{brands[id].name}</b><small>{brands[id].note}</small></span><ChevronRight /></button>)}</div><div className="info-note"><ShoppingBag /><span><b>Корзины не смешиваются</b><small>Переход в другой бренд откроет его собственный контекст.</small></span></div></div>
}

function BrandScreen({ go, session }: { go: Go; session: Session }) {
  const brand = brands[session.brand]
  const experience = brandExperience[session.brand]
  const heroImage: Partial<Record<BrandId, string>> = {
    pitcofe: 'gnocchi',
    mamadonna: 'burrata',
    esttort: 'onyx',
  }
  return <div className={`screen brand-screen tone-${brand.tone}`}>
    <ScreenHeader title={brand.name} go={go} />
    <section className="brand-hero">
      <div className="brand-visual">{heroImage[session.brand] ? <img src={`${import.meta.env.BASE_URL}dishes/${heroImage[session.brand]}.webp`} alt={session.brand === 'pitcofe' ? 'Ньокки в Питькофе' : session.brand === 'mamadonna' ? 'Буррата в MamaDonna' : 'Торт «Оникс» в ЕстьТорт'} /> : <div className="cream-visual" aria-hidden="true"><IceCreamBowl /></div>}<div className="brand-visual-mark"><BrandMark id={session.brand} /></div></div>
      <p>{experience.eyebrow}</p><h1>{experience.title.split('\n').map((line, index) => <span key={line}>{index > 0 && <br />}{line}</span>)}</h1><span>{experience.description}</span>
    </section>
    <div className="brand-actions">
      {session.brand === 'pitcofe' && <><button className="primary-action" onClick={() => go('/brand/pitcofe/format')}><ShoppingBag /><span><b>Заказать еду</b><small>доставка или самовывоз</small></span><ArrowRight /></button><button onClick={() => go('/booking')}><CalendarDays /><span><b>Забронировать столик</b><small>дата, время и число гостей</small></span><ChevronRight /></button></>}
      {session.brand === 'mamadonna' && <><button className="primary-action" onClick={() => go('/booking')}><CalendarDays /><span><b>Забронировать столик</b><small>отправить запрос на выбранное время</small></span><ArrowRight /></button><button onClick={() => go('/brand/mamadonna/format')}><ShoppingBag /><span><b>Заказать блюда</b><small>доставка или самовывоз</small></span><ChevronRight /></button></>}
      {session.brand === 'esttort' && <><button className="primary-action" onClick={() => go('/cake')}><CakeSlice /><span><b>Подобрать торт</b><small>начинка, вес и желаемая дата</small></span><ArrowRight /></button><button onClick={() => go('/brand/esttort/format')}><ShoppingBag /><span><b>Смотреть готовые десерты</b><small>по доступности выбранной точки</small></span><ChevronRight /></button></>}
      {session.brand === 'cream' && <button className="primary-action" onClick={() => go('/brand/cream/format')}><MapPin /><span><b>Что известно о Cream</b><small>адрес, меню и доступность</small></span><ArrowRight /></button>}
    </div>
    <button className="switch-brand" onClick={() => go('/')}>Сменить бренд</button>
  </div>
}

function CreamInfoScreen({ go }: { go: Go }) {
  return <div className="screen cream-info-screen"><ScreenHeader title="Cream" go={go} back="/brand/cream" /><div className="empty"><IceCreamBowl /><h1>Заказ пока недоступен</h1><p>Мы не нашли подтверждённые адрес точки, меню и условия заказа. Поэтому здесь нет вымышленного каталога или оформления.</p></div><button className="cta" onClick={() => go('/')}>Выбрать другой бренд <ArrowRight /></button></div>
}

function FormatScreen({ go, session, update }: { go: Go; session: Session; update: (p: Partial<Session>) => void }) {
  const [selectionValid, setSelectionValid] = useState(true)
  const locations = session.service === 'delivery' ? demoDeliveryAddresses : pickupLocations[session.brand]
  const mapLocations = locationsByBrand[session.brand]
  const selectedLocation = mapLocations.find((location) => location.address === session.address) ?? mapLocations[0]
  const selectService = (service: Service) => update({
    service,
    address: service === 'delivery' ? demoDeliveryAddresses[0] : (pickupLocations[session.brand][0] ?? ''),
  })
  return <div className="screen format-screen">
    <ScreenHeader title={brands[session.brand].name} go={go} back={`/brand/${session.brand}`} />
    <p className="step">01 / Формат</p><h1>Как получить заказ?</h1><p className="lead">Формат определяет доступное меню и условия до наполнения корзины.</p>
    <div className="segmented">
      <button className={session.service === 'delivery' ? 'active' : ''} onClick={() => selectService('delivery')}><Truck /><b>Доставка</b><small>условия после адреса</small></button>
      <button className={session.service === 'pickup' ? 'active' : ''} onClick={() => selectService('pickup')}><Store /><b>Самовывоз</b><small>из выбранной точки</small></button>
    </div>
    <h2>{session.service === 'delivery' ? 'Куда доставить' : 'Где забрать'}</h2>
    {session.service === 'pickup' && mapLocations.length ? <LocationMap
      points={mapLocations}
      selectedId={selectedLocation.id}
      onSelect={(location) => update({ address: location.address })}
      title={`Точки ${brands[session.brand].name}`}
      onValidityChange={setSelectionValid}
    /> : <div className="location-list">{locations.map((location) => <button className={`location-choice ${session.address === location ? 'active' : ''}`} key={location} onClick={() => update({ address: location })}><MapPin /><span><b>{location}</b><small>{session.service === 'delivery' ? 'Зона и срок уточняются до оформления' : 'Условия и доступность проверяются до меню'}</small></span>{session.address === location ? <Check /> : <ChevronRight />}</button>)}</div>}
    {session.service === 'pickup' && !mapLocations.length && <div className="empty"><MapPin /><h2>Адрес требует подтверждения</h2><p>В официальных источниках не найден актуальный публичный адрес точки Cream. Мы не показываем вымышленный маркер.</p></div>}
    <div className="info-note"><Clock3 /><span><b>Условия показаны заранее</b><small>Фактическое время и минимальная сумма зависят от адреса и загрузки точки.</small></span></div>
    <button className="cta" disabled={session.service === 'pickup' && (!mapLocations.length || !selectionValid)} onClick={() => go(`/brand/${session.brand}/menu`)}>Смотреть доступное меню <ArrowRight /></button>
  </div>
}

function MenuScreen({ go, session, update }: { go: Go; session: Session; update: (p: Partial<Session>) => void }) {
  const items = dishes[session.brand]
  const [category, setCategory] = useState<DishCategory | 'all'>('all')
  useEffect(() => setCategory('all'), [session.brand])
  const categories = [...new Set(items.map((item) => item.category))]
  const visibleItems = category === 'all' ? items : items.filter((item) => item.category === category)
  const count = itemCount(session.cart[session.brand])
  const total = cartTotal(session.cart[session.brand], prices(session.brand))
  const add = (itemId: string) => update({
    cart: { ...session.cart, [session.brand]: addItem(session.cart[session.brand], itemId) },
  })
  return <div className="screen menu-screen">
    <ScreenHeader title={brands[session.brand].name} go={go} back={`/brand/${session.brand}/format`} />
    <button className="menu-context" onClick={() => go(`/brand/${session.brand}/format`)}><span><b>{session.service === 'delivery' ? 'Доставка' : 'Самовывоз'}</b><small>{session.address}</small></span><ChevronRight /></button>
    <div className="menu-title"><div><p className="eyebrow">Доступно сейчас</p><h1>Меню</h1></div><button aria-label="Поиск" onClick={() => go('/search')}><Search /></button></div>
    {categories.length > 1 && <div className="chips"><button className={category === 'all' ? 'active' : ''} onClick={() => setCategory('all')}>Все блюда</button>{categories.map((id) => <button key={id} className={category === id ? 'active' : ''} onClick={() => setCategory(id)}>{categoryLabels[id]}</button>)}</div>}
    <div className="dish-list">
      {visibleItems.map((item) => <article className="dish-card" key={item.id}><button className="dish-art-button" aria-label={`Открыть ${item.title}`} onClick={() => go(`/product/${item.id}`)}><DishArt item={item} /></button><div><button className="dish-title" onClick={() => go(`/product/${item.id}`)}>{item.title}</button><small>{item.meta}</small><footer><b>{item.price ? `${item.price} ₽` : 'Уточнить'}</b>{item.price ? <button aria-label={`Добавить ${item.title}`} onClick={() => add(item.id)}><Plus /></button> : <button aria-label="Открыть" onClick={() => go(`/product/${item.id}`)}><ArrowRight /></button>}</footer></div></article>)}
    </div>
    <p className="demo-caption">Ассортимент и цены собраны по открытым меню на 11.08.2026 и могут измениться.</p>
    {count > 0 && <button className="floating-cart" onClick={() => go(`/cart/${session.brand}`)}><span><ShoppingBag /> {count}</span><b>В корзину</b><span>{total ? `${total} ₽` : 'Уточнить'}</span></button>}
  </div>
}

function ProductScreen({ go, session, update, productId }: { go: Go; session: Session; update: (p: Partial<Session>) => void; productId: string }) {
  const item = dishes[session.brand].find((entry) => entry.id === productId)
  const [count, setCount] = useState(1)
  const [note, setNote] = useState('')
  if (!item) return <div className="screen product-screen"><ScreenHeader title="Блюдо" go={go} back={`/brand/${session.brand}/menu`} /><div className="empty"><UtensilsCrossed /><h1>Блюдо не найдено</h1><p>Откройте меню и выберите доступную позицию.</p><button className="cta" onClick={() => go(`/brand/${session.brand}/menu`)}>Открыть меню</button></div></div>
  const add = () => {
    update({
      cart: { ...session.cart, [session.brand]: addItem(session.cart[session.brand], lineKey(item.id, note), count) },
    })
    go(`/cart/${session.brand}`)
  }
  return <div className="screen product-screen">
    <ScreenHeader title={brands[session.brand].name} go={go} back={`/brand/${session.brand}/menu`} />
    <DishArt item={item} large />
    <p className="eyebrow">{item.meta}</p><h1>{item.title}</h1><p className="lead">Состав и доступность сверяются для выбранной точки перед оформлением.</p>
    <label className="product-note"><span>Пожелание к блюду</span><textarea value={note} onChange={(event) => setNote(event.target.value.slice(0, 120))} placeholder="Например, без лука" maxLength={120} /><small>Уточним возможность изменения при подтверждении заказа.</small></label>
    <div className="product-buy"><div className="counter"><button aria-label="Уменьшить" onClick={() => setCount(Math.max(1, count - 1))}><Minus /></button><b>{count}</b><button aria-label="Увеличить" onClick={() => setCount(count + 1)}><Plus /></button></div><button className="cta" onClick={add}>Добавить · {item.price * count} ₽</button></div>
  </div>
}

function CartScreen({ go, session, update }: { go: Go; session: Session; update: (p: Partial<Session>) => void }) {
  const lines = cartEntries(session, session.brand)
  const count = itemCount(session.cart[session.brand])
  const total = cartTotal(session.cart[session.brand], prices(session.brand))
  const change = (id: string, nextCount: number) => update({
    cart: { ...session.cart, [session.brand]: setItemCount(session.cart[session.brand], id, nextCount) },
  })
  return <div className="screen cart-screen">
    <ScreenHeader title="Корзина" go={go} back={`/brand/${session.brand}/menu`} />
    <div className="cart-brand"><BrandMark id={session.brand} small /><span><b>{brands[session.brand].name}</b><small>Отдельный заказ бренда</small></span></div>
    {count === 0 ? <div className="empty"><ShoppingBag /><h1>Корзина пока пуста</h1><p>Выберите позиции в меню этого бренда.</p><button className="cta" onClick={() => go(`/brand/${session.brand}/menu`)}>Перейти в меню</button></div> : <>
      {lines.map(({ key, item, note, count: quantity }) => <article className="cart-item" key={key}>
        <MiniDishArt item={item} />
        <span><b>{item.title}</b>{note && <small>Пожелание: {note}</small>}<em>{item.price ? `${item.price} ₽` : 'Цена уточняется'}</em></span>
        <div className="counter small"><button aria-label={`Уменьшить ${item.title}${note ? ` — ${note}` : ''}`} onClick={() => change(key, quantity - 1)}><Minus /></button><b>{quantity}</b><button aria-label={`Увеличить ${item.title}${note ? ` — ${note}` : ''}`} onClick={() => change(key, quantity + 1)}><Plus /></button></div>
      </article>)}
      <button className="add-more" onClick={() => go(`/brand/${session.brand}/menu`)}><Plus /> Добавить ещё из {brands[session.brand].name}</button>
      <div className="cart-summary"><span>Товары <b>{total ? `${total} ₽` : 'уточняются'}</b></span><span>{session.service === 'delivery' ? 'Доставка' : 'Самовывоз'} <b>{session.service === 'delivery' ? 'рассчитается далее' : '0 ₽'}</b></span><strong>Итого <b>{total ? `${total} ₽` : 'после уточнения'}</b></strong></div>
      <p className="safe-note">Корзина сохранится, даже если оплата завершится ошибкой.</p>
      <button className="cta" onClick={() => go(`/checkout/${session.brand}`)}>К оформлению <ArrowRight /></button>
    </>}
  </div>
}

function CheckoutScreen({ go, session, update, loading, setLoading }: { go: Go; session: Session; update: (p: Partial<Session>) => void; loading: boolean; setLoading: (v: boolean) => void }) {
  const time = session.checkoutTime
  const [now, setNow] = useState(() => new Date())
  useEffect(() => { const timer = window.setInterval(() => setNow(new Date()), 60_000); return () => window.clearInterval(timer) }, [])
  const intervalOptions = upcomingOrderIntervals(now)
  const validTime = time === 'Ближайшее время' || intervalOptions.includes(time)
  const card = session.checkoutPayment
  const [editing, setEditing] = useState<'time' | 'payment' | null>(null)
  const lines = cartEntries(session, session.brand)
  const total = cartTotal(session.cart[session.brand], prices(session.brand))
  const validContacts = session.profile.name.trim().length >= 2 && session.profile.phone.replace(/\D/g, '').length >= 11
  const pay = () => {
    if (!lines.length || !validContacts || !validTime || loading) return
    setLoading(true)
    window.setTimeout(() => {
      setLoading(false)
      if (card === 'Банковская карта' && !session.paymentFailed) { update({ paymentFailed: true }); go('/payment-error') }
      else {
        const order: Order = {
          id: `RP-${Date.now()}`, brand: session.brand, service: session.service,
          address: session.address, createdAt: new Date().toISOString(),
          lines: { ...session.cart[session.brand] }, total, time, payment: card,
        }
        update({
          orders: [order, ...session.orders],
          cart: { ...session.cart, [session.brand]: {} },
          paymentFailed: false,
        })
        go('/order/success')
      }
    }, 650)
  }
  return <div className="screen checkout-screen">
    <ScreenHeader title="Оформление" go={go} back={`/cart/${session.brand}`} />
    <p className="step">03 / Подтверждение</p><h1>Проверьте заказ</h1>
    <div className="checkout-block"><span>{session.service === 'delivery' ? <Truck /> : <Store />}<b>{session.service === 'delivery' ? 'Доставка' : 'Самовывоз'}</b></span><small>{session.address}</small><button onClick={() => go(`/brand/${session.brand}/format`)}>Изменить</button></div>
    <div className="checkout-block"><span><Clock3 /><b>{time}</b></span><small>Интервал подтвердит оператор</small><button onClick={() => setEditing('time')}>Выбрать</button></div>
    <div className="checkout-block"><span><CreditCard /><b>{card}</b></span><small>Выберите удобный способ</small><button onClick={() => setEditing('payment')}>Выбрать</button></div>
    {editing && <div className="choice-sheet" role="dialog" aria-label={editing === 'time' ? 'Выбор времени' : 'Выбор оплаты'}><div><b>{editing === 'time' ? 'Когда получить заказ' : 'Способ оплаты'}</b><button aria-label="Закрыть" onClick={() => setEditing(null)}>×</button></div>{(editing === 'time' ? ['Ближайшее время', ...intervalOptions] : ['Банковская карта', 'При получении']).map((value) => <button className={(editing === 'time' ? time : card) === value ? 'active' : ''} key={value} onClick={() => { update(editing === 'time' ? { checkoutTime: value } : { checkoutPayment: value }); setEditing(null) }}>{value}<Check /></button>)}</div>}
    <h2>Состав заказа</h2>{lines.map(({ key, item, note, count }) => <div className="checkout-order" key={key}><MiniDishArt item={item} /><span><b>{item.title}</b><small>{count} × {item.price ? `${item.price} ₽` : 'цена уточняется'}{note ? ` · ${note}` : ''}</small></span><strong>{item.price ? `${item.price * count} ₽` : 'уточняется'}</strong></div>)}
    <h2>Контакты</h2><div className="contact-fields"><label><span>Имя</span><input value={session.profile.name} onChange={(event) => update({ profile: { ...session.profile, name: event.target.value } })} /></label><label><span>Телефон</span><input inputMode="tel" value={session.profile.phone} onChange={(event) => update({ profile: { ...session.profile, phone: event.target.value } })} /></label></div>
    <div className="total"><span>К оплате</span><b>{total ? `${total} ₽` : 'уточняется'}</b></div>
    <button className="cta" disabled={loading || !lines.length || !validContacts || !validTime} onClick={pay}>{loading ? <><span className="spinner" /> Проверяем…</> : <>Подтвердить заказ <ArrowRight /></>}</button>
    {!validContacts && <p className="field-error">Укажите имя и телефон, чтобы продолжить.</p>}
    {!validTime && <p className="field-error">Выбранный интервал уже прошёл. Укажите другое время.</p>}
  </div>
}

function UnavailableCheckout({ go, brand }: { go: Go; brand?: BrandId }) {
  return <div className="screen status-screen"><div className="status-icon"><ShoppingBag /></div><h1>Оформлять пока нечего</h1><p>Добавьте позиции в корзину, чтобы продолжить.</p><button className="cta" onClick={() => go(brand ? `/brand/${brand}/menu` : '/order')}>{brand ? 'Открыть меню' : 'Выбрать бренд'}</button></div>
}

function PaymentError({ go, session }: { go: Go; session: Session }) {
  return <div className="screen status-screen error-screen"><div className="status-icon"><CircleAlert /></div><p className="eyebrow">Оплата не завершена</p><h1>Корзина на месте</h1><p>Позиции, адрес и формат сохранены. Можно вернуться к оплате без повторного сбора заказа.</p><div className="saved-cart"><BrandMark id={session.brand} small /><span><b>{brands[session.brand].name}</b><small>{itemCount(session.cart[session.brand])} шт. · параметры сохранены</small></span><Check /></div><button className="cta" onClick={() => go(`/checkout/${session.brand}`)}>Вернуться к оплате</button><button className="text-button" onClick={() => go(`/cart/${session.brand}`)}>Изменить корзину</button></div>
}

function OrderSuccess({ go, session }: { go: Go; session: Session }) {
  if (!session.orders.length) return <div className="screen status-screen"><h1>Заказ не найден</h1><p>Оформите заказ, чтобы увидеть подтверждение и повторить его из истории.</p><button className="cta" onClick={() => go('/order')}>К выбору еды</button></div>
  const order = session.orders[0]
  return <div className="screen status-screen success-screen"><div className="status-icon"><PackageCheck /></div><p className="eyebrow">Демонстрационный заказ</p><h1>Заказ сохранён</h1><p>№ {order.id} · {brands[order.brand].name}<br />{order.service === 'pickup' ? 'Самовывоз' : 'Доставка'}: {order.address}<br />{order.time || 'Ближайшее время'} · {order.payment || 'Способ оплаты не сохранён'}<br />Сумма товаров: {order.total} ₽</p><div className="timeline"><i /><span><b>Заявка сохранена в браузере</b><small>Реальный заказ не отправлен</small></span></div><button className="cta" onClick={() => go('/')}>На главный экран</button><button className="text-button" onClick={() => go('/history')}>История заказов</button></div>
}

function bookingDateISO(label: string, now: Date, extraDays = 0) {
  const offset = bookingDateOptions(now).indexOf(label) + extraDays
  if (offset < 0) return ''
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Moscow', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now)
  const number = (type: string) => Number(parts.find((part) => part.type === type)?.value)
  return new Date(Date.UTC(number('year'), number('month') - 1, number('day') + offset, 12)).toISOString().slice(0, 10)
}

function bookingDateLabel(dateISO: string) {
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Moscow' }).format(new Date(`${dateISO}T12:00:00Z`))
}

function BookingScreen({ go, session, update }: { go: Go; session: Session; update: (p: Partial<Session>) => void }) {
  const [now, setNow] = useState(() => new Date())
  const [name, setName] = useState(() => session.booking.name || session.profile.name)
  const [phone, setPhone] = useState(() => session.booking.phone || session.profile.phone)
  useEffect(() => { const timer = window.setInterval(() => setNow(new Date()), 60_000); return () => window.clearInterval(timer) }, [])
  const booking = session.booking
  const locations = locationsByBrand[booking.brand]
  const locationId = locations.some((location) => location.id === booking.locationId) ? booking.locationId : locations[0].id
  const bookingTimes = ['18:30', '19:00', '19:30', '20:00']
  const validBooking = isFutureBookingTime(booking.date, booking.time, now) && name.trim().length >= 2 && phone.replace(/\D/g, '').length === 11 && booking.guests >= 1 && booking.guests <= 12
  const change = (patch: Partial<Session['booking']>) => update({ booking: { ...booking, ...patch } })
  const save = () => {
    if (!validBooking) return
    const existing = session.bookings.find((request) => request.id === session.activeBookingId)
    const request: BookingRequest = { id: existing?.id ?? crypto.randomUUID(), brand: booking.brand, dateISO: bookingDateISO(booking.date, now), time: booking.time, guests: booking.guests, locationId, name: name.trim(), phone: phone.trim(), createdAt: existing?.createdAt ?? new Date().toISOString() }
    update({ bookings: [request, ...session.bookings.filter((entry) => entry.id !== request.id)], activeBookingId: request.id, booking: { ...booking, locationId, name: name.trim(), phone: phone.trim() } })
    go('/booking/success')
  }
  return <div className="screen booking-screen">
    <ScreenHeader title="Запрос столика" go={go} />
    <p className="step">Демо-заявка</p><h1>Выберите удобные<br />параметры визита</h1>
    <p className="lead">Вы сохраните заявку в этом браузере. Ресторан не получит её из прототипа.</p>
    <h2>Ресторан</h2><div className="brand-pills">{(['mamadonna', 'pitcofe'] as const).map((id) => <button className={booking.brand === id ? 'active' : ''} key={id} onClick={() => change({ brand: id, locationId: locationsByBrand[id][0].id })}><BrandMark id={id} small /><span><b>{brands[id].name}</b><small>{locationsByBrand[id].length} точек для выбора</small></span></button>)}</div>
    <label className="profile-field"><span>Точка и адрес</span><select value={locationId} onChange={(event) => change({ locationId: event.target.value })}>{locations.map((location) => <option key={location.id} value={location.id}>{location.name} · {location.address}</option>)}</select></label>
    <h2>Дата</h2><div className="chips booking-chips">{bookingDateOptions(now).map((value) => <button className={booking.date === value ? 'active' : ''} key={value} onClick={() => change({ date: value })}>{value}</button>)}</div>
    <h2>Время</h2><div className="time-grid">{bookingTimes.map((value) => <button className={booking.time === value ? 'active' : ''} disabled={!isFutureBookingTime(booking.date, value, now)} key={value} onClick={() => change({ time: value })}>{value}</button>)}</div>
    <div className="guest-row"><span><UsersRound /><b>Количество гостей</b></span><div className="counter"><button aria-label="Уменьшить" onClick={() => change({ guests: Math.max(1, booking.guests - 1) })}><Minus /></button><b>{booking.guests}</b><button aria-label="Увеличить" onClick={() => change({ guests: Math.min(12, booking.guests + 1) })}><Plus /></button></div></div>
    <h2>Контакт для ответа</h2><div className="contact-fields"><label><span>Имя</span><input value={name} onChange={(event) => { setName(event.target.value); change({ name: event.target.value }) }} /></label><label><span>Телефон</span><input inputMode="tel" value={phone} onChange={(event) => { setPhone(event.target.value); change({ phone: event.target.value }) }} /></label></div>
    <p className="safe-note">Реального подтверждения нет. В рабочем приложении по этому контакту ресторан ответил бы после проверки доступности.</p>
    <button className="cta" disabled={!validBooking} onClick={save}>{session.activeBookingId ? 'Сохранить изменения' : 'Сохранить запрос'} <ArrowRight /></button>
    {!validBooking && <p className="field-error">Выберите будущее время и укажите имя и телефон.</p>}
  </div>
}

function BookingSuccess({ go, session }: { go: Go; session: Session }) {
  const request = session.bookings.find((entry) => entry.id === session.activeBookingId)
  if (!request) return <div className="screen status-screen"><h1>Заявка не найдена</h1><button className="cta" onClick={() => go('/booking')}>Создать заявку</button></div>
  const location = locationsByBrand[request.brand].find((entry) => entry.id === request.locationId)
  return <div className="screen status-screen success-screen booking-success"><div className="status-icon"><CalendarDays /></div><p className="eyebrow">Запрос сохранён в браузере</p><h1>{brands[request.brand].name}<br />{bookingDateLabel(request.dateISO)} в {request.time}</h1><p>{request.guests} {guestWord(request.guests)} · {location?.name}<br />{location?.address}<br />Контакт: {request.name}, {request.phone}<br />Ресторану запрос не отправлен.</p><div className="ticket"><span>Номер запроса</span><b>{request.id.slice(0, 8).toUpperCase()}</b></div><button className="cta" onClick={() => go('/history')}>Открыть историю</button><button className="text-button" onClick={() => go('/booking')}>Изменить заявку</button></div>
}

function guestWord(guests: number) {
  if (guests % 10 === 1 && guests % 100 !== 11) return 'гость'
  if ([2, 3, 4].includes(guests % 10) && ![12, 13, 14].includes(guests % 100)) return 'гостя'
  return 'гостей'
}

function CakeScreen({ go, session, update }: { go: Go; session: Session; update: (p: Partial<Session>) => void }) {
  const cake = session.cake
  const change = (patch: Partial<Session['cake']>) => update({ cake: { ...cake, ...patch } })
  const today = new Date()
  const minDate = bookingDateISO('Сегодня', today, 3)
  const maxDate = bookingDateISO('Сегодня', today, 30)
  const valid = cake.date >= minDate && cake.date <= maxDate && cake.name.trim().length >= 2 && cake.phone.replace(/\D/g, '').length === 11 && cake.address.trim().length >= 8
  const save = () => {
    if (!valid) return
    const existing = session.cakeRequests.find((request) => request.id === session.activeCakeId)
    const request: CakeRequest = { id: existing?.id ?? crypto.randomUUID(), kind: cake.kind, filling: cake.filling, weight: cake.weight, dateISO: cake.date, service: cake.service, address: cake.address.trim(), name: cake.name.trim(), phone: cake.phone.trim(), note: cake.note.trim(), createdAt: existing?.createdAt ?? new Date().toISOString() }
    update({ cakeRequests: [request, ...session.cakeRequests.filter((entry) => entry.id !== request.id)], activeCakeId: request.id })
    go('/cake/success')
  }
  return <div className="screen cake-screen">
    <ScreenHeader title="Заявка на торт" go={go} />
    <div className="cake-hero"><CakeSlice /><p>ЕстьТорт</p><h1>Торт для вашего<br />повода</h1></div>
    <p className="lead">Это запрос на изготовление, не покупка готового торта. Кондитер уточнит состав, стоимость и возможность выполнить заказ.</p>
    <h2>Категория</h2><div className="chips">{['Праздничный', 'Детский', 'Свадебный'].map((value) => <button className={cake.kind === value ? 'active' : ''} onClick={() => change({ kind: value })} key={value}>{value}</button>)}</div>
    <h2>Начинка</h2><div className="choice-list">{['Чёрный лес', 'Сан-Себастьян', 'Оникс'].map((value) => <button className={cake.filling === value ? 'active' : ''} onClick={() => change({ filling: value })} key={value}><span><b>{value}</b><small>Состав и доступность уточняются при согласовании</small></span>{cake.filling === value && <Check />}</button>)}</div>
    <h2>Вес и дата</h2><p className="field-hint">Вес — ориентир для расчёта. Дата — не раньше чем через 3 дня; можно выбрать день в пределах месяца.</p>
    <div className="two-fields"><label><small>Вес торта</small><select value={cake.weight} onChange={(event) => change({ weight: event.target.value })}>{['1 кг', '1,5 кг', '2 кг', '2,5 кг', '3 кг', '4 кг', '5 кг'].map((value) => <option key={value}>{value}</option>)}</select></label><label><small>Желаемая дата</small><input type="date" value={cake.date} min={minDate} max={maxDate} onChange={(event) => change({ date: event.target.value })} /></label></div>
    {cake.date < minDate || cake.date > maxDate ? <p className="field-error">Выберите дату от {bookingDateLabel(minDate)} до {bookingDateLabel(maxDate)}.</p> : null}
    <h2>Получение</h2><div className="chips">{(['pickup', 'delivery'] as const).map((service) => <button key={service} className={cake.service === service ? 'active' : ''} onClick={() => change({ service, address: service === 'pickup' ? locationsByBrand.esttort[0].address : '' })}>{service === 'pickup' ? 'Самовывоз' : 'Доставка'}</button>)}</div>
    {cake.service === 'pickup' ? <label className="profile-field"><span>Точка ЕстьТорт</span><select value={cake.address} onChange={(event) => change({ address: event.target.value })}>{locationsByBrand.esttort.map((location) => <option key={location.id} value={location.address}>{location.name} · {location.address}</option>)}</select></label> : <label className="profile-field"><span>Желаемый адрес доставки</span><input value={cake.address} onChange={(event) => change({ address: event.target.value })} placeholder="Улица, дом, квартира" /></label>}
    <h2>Контакт для согласования</h2><div className="contact-fields"><label><span>Имя</span><input value={cake.name} onChange={(event) => change({ name: event.target.value })} /></label><label><span>Телефон</span><input inputMode="tel" value={cake.phone} onChange={(event) => change({ phone: event.target.value })} /></label></div>
    <label className="profile-field"><span>Пожелание к декору или событию · необязательно</span><textarea value={cake.note} maxLength={300} onChange={(event) => change({ note: event.target.value })} placeholder="Например, надпись и цвета" /></label>
    <div className="info-note"><CircleAlert /><span><b>Пока только демо-заявка</b><small>Она сохранится в этом браузере, но не отправится в кондитерскую. Для настоящего заказа свяжитесь с ЕстьТорт.</small></span></div>
    <button className="cta" disabled={!valid} onClick={save}>{session.activeCakeId ? 'Сохранить изменения' : 'Сохранить запрос'} <ArrowRight /></button>
    {!valid && <p className="field-error">Укажите допустимую дату, место получения, имя и телефон.</p>}
  </div>
}

function CakeSuccess({ go, session }: { go: Go; session: Session }) {
  const request = session.cakeRequests.find((entry) => entry.id === session.activeCakeId)
  if (!request) return <div className="screen status-screen"><h1>Заявка не найдена</h1><button className="cta" onClick={() => go('/cake')}>Создать заявку</button></div>
  return <div className="screen status-screen cake-success"><div className="status-icon"><CakeSlice /></div><p className="eyebrow">Демо-заявка сохранена</p><h1>Параметры<br />записаны</h1><p>{request.kind} · «{request.filling}» · {request.weight}<br />К {bookingDateLabel(request.dateISO)}<br />{request.service === 'pickup' ? 'Самовывоз' : 'Доставка'}: {request.address}<br />Контакт: {request.name}, {request.phone}{request.note && <><br />Пожелание: {request.note}</>}<br />Кондитерская не получила эту заявку.</p><div className="ticket"><span>Номер запроса</span><b>ET–{request.id.slice(0, 8).toUpperCase()}</b></div><button className="cta" onClick={() => go('/history')}>Открыть историю</button><button className="text-button" onClick={() => go('/cake')}>Изменить заявку</button><a className="text-button" href="https://esttort.ru/" target="_blank" rel="noreferrer">Связаться с ЕстьТорт</a></div>
}

function ProfileScreen({ go, session, update }: { go: Go; session: Session; update: (p: Partial<Session>) => void }) {
  const [saved, setSaved] = useState(false)
  const [name, setName] = useState(session.profile.name)
  const [phone, setPhone] = useState(session.profile.phone)
  return <div className="screen profile-screen"><ScreenHeader title="Профиль" go={go} /><p className="eyebrow">Личные данные</p><h1>Контакты<br />для оформления</h1><p className="lead">Сохранённые контакты появятся при оформлении заказа.</p><label className="profile-field"><span>Имя</span><input value={name} onChange={(event) => { setName(event.target.value); setSaved(false) }} /></label><label className="profile-field"><span>Телефон</span><input inputMode="tel" value={phone} onChange={(event) => { setPhone(event.target.value); setSaved(false) }} /></label><button className="cta" disabled={name.trim().length < 2 || phone.replace(/\D/g, '').length < 11} onClick={() => { update({ profile: { name: name.trim(), phone } }); setSaved(true) }}>{saved ? <><Check /> Сохранено</> : 'Сохранить контакты'}</button><div className="profile-links"><button onClick={() => go('/history')}><History /><span><b>История заказов</b><small>оформленные заказы и повтор</small></span><ChevronRight /></button><button onClick={() => go('/loyalty')}><TicketCheck /><span><b>Карты лояльности</b><small>правила каждого бренда отдельно</small></span><ChevronRight /></button></div></div>
}

function HistoryScreen({ go, session, update }: { go: Go; session: Session; update: (p: Partial<Session>) => void }) {
  return <div className="screen history-screen">
    <ScreenHeader title="Мои действия" go={go} />
    <p className="eyebrow">История</p><h1>Ваши действия</h1><h2>Заказы еды</h2>
    {session.orders.length ? session.orders.map((order) => <article className="history-card" key={order.id}>
      <div><BrandMark id={order.brand} small /><span><b>{brands[order.brand].name}</b><small>{new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Moscow' }).format(new Date(order.createdAt))} · {order.service === 'delivery' ? 'доставка' : 'самовывоз'}</small></span></div>
      <h3>{Object.keys(order.lines).map((key) => { const title = dishes[order.brand].find((item) => item.id === lineItemId(key))?.title || 'Позиция вне меню'; const note = lineNote(key); return note ? `${title} · ${note}` : title }).join(', ')}</h3>
      <footer><b>{order.total} ₽</b><button onClick={() => { update({ brand: order.brand, repeatOrderId: order.id }); go('/repeat') }}>Повторить <ArrowRight /></button></footer>
    </article>) : <div className="empty compact"><History /><h3>Заказов пока нет</h3><p>После оформления заказ появится здесь, и его можно будет повторить.</p><button onClick={() => go('/order')}>Выбрать еду</button></div>}
    <h2>Запросы столика</h2>
    {session.bookings.length ? session.bookings.map((request) => {
      const location = locationsByBrand[request.brand].find((entry) => entry.id === request.locationId)
      return <article className="history-card request-card" key={request.id}>
        <div><CalendarDays /><span><b>{brands[request.brand].name}</b><small>Запрос сохранён в браузере · ответ ресторана не получен</small></span></div>
        <h3>{bookingDateLabel(request.dateISO)} в {request.time} · {request.guests} {guestWord(request.guests)}</h3>
        <p>{location?.name} · {location?.address}<br />Контакт: {request.name}, {request.phone}</p>
        <footer><b>№ {request.id.slice(0, 8).toUpperCase()}</b><button onClick={() => {
          const date = bookingDateOptions().find((label) => bookingDateISO(label, new Date()) === request.dateISO) ?? 'Сегодня'
          update({ activeBookingId: request.id, booking: { brand: request.brand, date, time: request.time, guests: request.guests, locationId: request.locationId, name: request.name, phone: request.phone } })
          go('/booking/success')
        }}>Подробнее <ArrowRight /></button></footer>
      </article>
    }) : <p className="lead">Сохранённые запросы столика появятся здесь.</p>}
    <button className="add-more" onClick={() => { update({ activeBookingId: null, booking: { ...initialSession.booking, name: session.profile.name, phone: session.profile.phone } }); go('/booking') }}>Новый запрос столика</button>
    <h2>Заявки на торт</h2>
    {session.cakeRequests.length ? session.cakeRequests.map((request) => <article className="history-card request-card" key={request.id}>
      <div><CakeSlice /><span><b>ЕстьТорт</b><small>Демо-заявка в браузере · не отправлена</small></span></div>
      <h3>{request.kind} · «{request.filling}» · {request.weight}</h3>
      <p>К {bookingDateLabel(request.dateISO)} · {request.service === 'pickup' ? 'самовывоз' : 'доставка'}: {request.address}<br />Контакт: {request.name}, {request.phone}{request.note && <><br />Пожелание: {request.note}</>}</p>
      <footer><b>ET–{request.id.slice(0, 8).toUpperCase()}</b><button onClick={() => { update({ activeCakeId: request.id, cake: { kind: request.kind, filling: request.filling, weight: request.weight, date: request.dateISO, service: request.service, address: request.address, name: request.name, phone: request.phone, note: request.note } }); go('/cake/success') }}>Подробнее <ArrowRight /></button></footer>
    </article>) : <p className="lead">Сохранённые заявки на торт появятся здесь.</p>}
    <button className="add-more" onClick={() => { update({ activeCakeId: null, cake: { ...initialSession.cake, date: bookingDateISO('Сегодня', new Date(), 3), name: session.profile.name, phone: session.profile.phone } }); go('/cake') }}>Новая заявка на торт</button>
  </div>
}

function RepeatScreen({ go, session, update }: { go: Go; session: Session; update: (p: Partial<Session>) => void }) {
  const [checked, setChecked] = useState(false)
  const order = session.orders.find((entry) => entry.id === session.repeatOrderId)
  if (!order) return <div className="screen repeat-screen"><ScreenHeader title="Повтор заказа" go={go} back="/history" /><div className="empty"><History /><h1>Нет заказа для повтора</h1><p>Выберите заказ в истории.</p><button className="cta" onClick={() => go('/history')}>Открыть историю</button></div></div>
  const available = Object.entries(order.lines).filter(([key]) => dishes[order.brand].some((item) => item.id === lineItemId(key) && item.price > 0))
  const unavailable = Object.entries(order.lines).filter(([key]) => !dishes[order.brand].some((item) => item.id === lineItemId(key) && item.price > 0))
  const repeat = () => {
    update({ brand: order.brand, cart: { ...session.cart, [order.brand]: Object.fromEntries(available) } })
    setChecked(true)
  }
  return <div className="screen repeat-screen">
    <ScreenHeader title="Повтор заказа" go={go} back="/history" />
    <p className="step">Проверка перед корзиной</p><h1>Повторить заказ</h1>
    <p className="lead">Цена и доступность проверяются заново для выбранного адреса.</p>
    <div className="repeat-list">
      {available.map(([key, count]) => { const item = dishes[order.brand].find((entry) => entry.id === lineItemId(key))!; const note = lineNote(key); return <span key={key}><Check /><b>{item.title} · {count} шт.{note ? ` · ${note}` : ''}</b><em>{item.price * count} ₽</em></span> })}
      {unavailable.map(([id]) => <span className="unavailable" key={id}><CircleAlert /><b>Позиция вне текущего меню</b><em>не добавлена</em></span>)}
    </div>
    {checked && <div className="success-note"><Check /><span><b>{available.length} позиции добавлены</b><small>Недоступные позиции пропущены. Корзина относится только к {brands[order.brand].name}.</small></span></div>}
    <button className="cta" disabled={!available.length} onClick={checked ? () => go(`/cart/${order.brand}`) : repeat}>{checked ? 'Открыть корзину' : 'Проверить и повторить'} <ArrowRight /></button>
  </div>
}

function LoyaltyScreen({ go }: { go: Go }) {
  const [brand, setBrand] = useState<BrandId>('pitcofe')
  const info = brand === 'pitcofe'
    ? { title: 'Бонусы Питькофе', detail: 'Баланс и доступные бонусы можно посмотреть в приложении Питькофе.', link: 'Страница приложения', href: 'https://apps.apple.com/ru/app/id1608159331' }
    : { title: 'Бонусы MamaDonna', detail: 'У MamaDonna свои правила начисления и списания бонусов.', link: 'Условия программы', href: 'https://mamadonna.ru/bonuses/' }
  return <div className="screen loyalty-screen">
    <ScreenHeader title="Лояльность" go={go} />
    <p className="step">Бонусные программы</p><h1>Выберите<br />ресторан</h1><p className="lead">У каждого бренда своя программа и свой баланс.</p>
    <div className="loyalty-brands">{(['pitcofe', 'mamadonna'] as BrandId[]).map((id) => <button className={brand === id ? 'active' : ''} key={id} onClick={() => setBrand(id)}><BrandMark id={id} small />{brands[id].name}</button>)}</div>
    <div className={`loyalty-card ${brands[brand].tone}`}><span><BrandMark id={brand} small /><small>{brands[brand].name}</small></span><div><h2>{info.title}</h2><p>{info.detail}</p></div><a href={info.href} target="_blank" rel="noreferrer">{info.link} <ArrowRight /></a></div>
  </div>
}

function OffersScreen({ go }: { go: Go }) {
  return <div className="screen offers-screen"><ScreenHeader title="Для вас" go={go} /><p className="eyebrow">Куда дальше</p><h1>Планы на день<br />в одном месте</h1><article className="offer-main"><span>Питькофе</span><h2>Повторить обед<br />без поиска по меню</h2><button onClick={() => go('/repeat')}>Повторить заказ <ArrowRight /></button></article><h2>Другие планы</h2><button className="cross-offer tomato" onClick={() => go('/booking')}><BrandMark id="mamadonna" small /><span><b>Запросить столик в MamaDonna</b><small>Указать дату, время и гостей; доступность подтвердит ресторан</small></span><ChevronRight /></button><button className="cross-offer berry" onClick={() => go('/cake')}><BrandMark id="esttort" small /><span><b>Торт к событию</b><small>Выбрать параметры отдельной заявки ЕстьТорт</small></span><ChevronRight /></button></div>
}

function SearchScreen({ go, session }: { go: Go; session: Session }) {
  const [query, setQuery] = useState('')
  const results = query.trim() ? dishes[session.brand].filter((item) => `${item.title} ${item.meta}`.toLocaleLowerCase('ru').includes(query.trim().toLocaleLowerCase('ru'))) : []
  return <div className="screen search-screen"><ScreenHeader title="Поиск" go={go} back={`/brand/${session.brand}/menu`} /><label className="search-box"><Search /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Блюдо или категория" /></label>{query.trim() ? (results.length ? <div className="search-results">{results.map((item) => <div className="search-result" key={item.id}><MiniDishArt item={item} /><span><b>{item.title}</b><small>{brands[session.brand].name} · {item.price ? `${item.price} ₽` : 'цена уточняется'}</small></span><button aria-label={`Открыть ${item.title}`} onClick={() => go(`/product/${item.id}`)}><ArrowRight /></button></div>)}</div> : <div className="empty"><Search /><h1>Ничего не нашлось</h1><p>Попробуйте другое название внутри {brands[session.brand].name}.</p></div>) : <div className="empty"><Search /><h1>Что найти?</h1><p>Поиск работает внутри {brands[session.brand].name} и не смешивает меню.</p></div>}</div>
}

function NotFound({ go }: { go: Go }) {
  return <div className="screen status-screen"><div className="status-icon"><CircleAlert /></div><h1>Экран не найден</h1><p>Вернитесь на главный экран и выберите сценарий.</p><button className="cta" onClick={() => go('/')}>На главный экран</button></div>
}

function BottomNav({ route, go, cartCount, brand }: { route: string; go: Go; cartCount: number; brand: BrandId }) {
  return <nav className="bottom-nav" aria-label="Основная навигация"><button className={route === '/' ? 'active' : ''} onClick={() => go('/')}><Home /><span>Главная</span></button><button disabled={brand === 'cream'} className={route.includes('/menu') ? 'active' : ''} onClick={() => go(`/brand/${brand}/menu`)}><Coffee /><span>Меню</span></button><button disabled={brand === 'cream'} className={route.includes('/cart') ? 'active' : ''} onClick={() => go(`/cart/${brand}`)}><span className="icon-wrap"><ShoppingBag />{cartCount > 0 && <i>{cartCount}</i>}</span><span>Корзина</span></button><button className={route === '/history' ? 'active' : ''} onClick={() => go('/history')}><History /><span>История</span></button></nav>
}
