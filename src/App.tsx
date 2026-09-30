import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft, ArrowRight, BadgePercent, CalendarDays, CakeSlice, Check,
  ChevronRight, CircleAlert, Clock3, Coffee, CreditCard, History,
  Home, IceCreamBowl, MapPin, Minus, PackageCheck, Plus, Search, ShoppingBag,
  Sparkles, Star, Store, TicketCheck, Truck, UserRound, UsersRound, UtensilsCrossed,
} from 'lucide-react'
import { LocationMap } from './LocationMap'
import { locationsByBrand } from './locations'
import { bookingDateOptions, cakeDateOptions, formatKrasnodarDate, isFutureBookingTime, upcomingOrderIntervals } from './lib/schedule'
import { addItem, cartTotal, itemCount, setItemCount, type CartLines } from './lib/cart'

type BrandId = 'pitcofe' | 'mamadonna' | 'esttort' | 'cream'
type Service = 'delivery' | 'pickup'
type Session = {
  brand: BrandId
  service: Service
  cart: Record<BrandId, CartLines>
  paymentFailed: boolean
  address: string
  booking: {
    brand: 'pitcofe' | 'mamadonna'
    date: string
    time: string
    guests: number
  }
  cake: {
    kind: string
    filling: string
    weight: string
    date: string
  }
}

const brands: Record<BrandId, { name: string; note: string; tone: string }> = {
  pitcofe: { name: 'Питькофе', note: 'кофейни · доставка · навынос', tone: 'amber' },
  mamadonna: { name: 'MamaDonna', note: 'гастрокафе · заказ в кафе · доставка', tone: 'tomato' },
  esttort: { name: 'ЕстьТорт', note: 'торты на заказ · каталог начинок', tone: 'berry' },
  cream: { name: 'Cream', note: 'кондитерская · десерты в витрине', tone: 'cream' },
}

const brandExperience: Record<BrandId, { eyebrow: string; title: string; description: string }> = {
  pitcofe: { eyebrow: 'Кофейня рядом', title: 'Кофе и кухня\nв удобном формате', description: 'Выберите доставку или навынос, затем соберите заказ из меню выбранной точки.' },
  mamadonna: { eyebrow: 'Гастрокафе', title: 'Итальянский ритм\nдля встречи или ужина', description: 'Откройте меню, выберите формат заказа или подготовьте запрос на столик.' },
  esttort: { eyebrow: 'Кондитерский дом', title: 'Торт, собранный\nпод ваш повод', description: 'Выберите категорию, начинку, вес и желаемую дату — детали подтвердит кондитер.' },
  cream: { eyebrow: 'Кондитерская', title: 'Десертная витрина\nбез лишних обещаний', description: 'Посмотрите концепцию витрины. Актуальный адрес и наличие требуют подтверждения.' },
}

const dishes: Record<BrandId, Array<{ id: string; title: string; meta: string; price: number; art: string }>> = {
  pitcofe: [
    { id: 'gnocchi', title: 'Ньокки с говяжьими щёчками', meta: 'Основное блюдо · 390 г', price: 649, art: 'art-sage' },
    { id: 'carbonara', title: 'Карбонара', meta: 'Паста · 320 г', price: 529, art: 'art-sun' },
    { id: 'borsch', title: 'Борщ с говядиной', meta: 'Суп · 350 г', price: 529, art: 'art-red' },
  ],
  mamadonna: [
    { id: 'burrata', title: 'Буррата с томатами', meta: 'Салат · 250 г', price: 660, art: 'art-red' },
    { id: 'omelette', title: 'Омлет с креветками и авокадо', meta: 'Завтрак · 315 г', price: 650, art: 'art-sage' },
    { id: 'napoleon', title: 'Наполеон', meta: 'Десерт · 150 г', price: 320, art: 'art-sun' },
  ],
  esttort: [
    { id: 'sebastian', title: 'Чизкейк «Сан-Себастьян»', meta: 'от 1,6 кг', price: 2205, art: 'art-sun' },
    { id: 'onyx', title: 'Торт «Оникс»', meta: 'от 1,4 кг', price: 2709, art: 'art-berry' },
    { id: 'bento', title: 'Бенто-торт', meta: 'от 0,37 кг', price: 1365, art: 'art-pink' },
  ],
  cream: [
    { id: 'showcase', title: 'Витрина десертов', meta: 'ассортимент уточняется в точке', price: 0, art: 'art-cream' },
  ],
}

const emptyCart = (): Record<BrandId, CartLines> => ({ pitcofe: {}, mamadonna: {}, esttort: {}, cream: {} })
const prices = (brand: BrandId) => Object.fromEntries(dishes[brand].map((item) => [item.id, item.price]))
const cartEntries = (session: Session, brand: BrandId) => dishes[brand]
  .map((item) => ({ item, count: session.cart[brand][item.id] || 0 }))
  .filter(({ count }) => count > 0)

const demoDeliveryAddresses = ['ул. Пушкинская, 120А', 'просп. Соколова, 45']
const pickupLocations: Record<BrandId, string[]> = Object.fromEntries(
  Object.entries(locationsByBrand).map(([brand, locations]) => [brand, locations.map((location) => location.address)]),
) as Record<BrandId, string[]>

const initialSession: Session = {
  brand: 'pitcofe',
  service: 'delivery',
  cart: emptyCart(),
  paymentFailed: false,
  address: 'ул. Пушкинская, 120А',
  booking: { brand: 'mamadonna', date: 'Сегодня', time: '19:30', guests: 2 },
  cake: { kind: 'Праздничный', filling: 'Чёрный лес', weight: '2 кг', date: cakeDateOptions()[0] },
}

function readSession(): Session {
  try {
    const stored = { ...initialSession, ...JSON.parse(sessionStorage.getItem('restprofi-demo-v2') || '{}') }
    const oldCart = stored.cart as Record<BrandId, number | CartLines>
    stored.cart = Object.fromEntries((Object.keys(brands) as BrandId[]).map((brand) => {
      const value = oldCart?.[brand]
      const item = stored.cartItem?.[brand] || dishes[brand][0].id
      return [brand, typeof value === 'number' ? (value > 0 ? { [item]: value } : {}) : (value || {})]
    })) as Record<BrandId, CartLines>
    delete stored.cartItem
    if (!bookingDateOptions().includes(stored.booking?.date)) stored.booking.date = 'Сегодня'
    if (!cakeDateOptions().includes(stored.cake?.date)) stored.cake.date = cakeDateOptions()[0]
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
      setSession((value) => ({ ...value, brand: fromRoute }))
    }
  }, [route, session.brand])

  useEffect(() => {
    if (route === '/payment-error' && itemCount(session.cart[session.brand]) === 0) {
      setSession((value) => ({
        ...value,
        paymentFailed: true,
        cart: { ...value.cart, [value.brand]: addItem(value.cart[value.brand], dishes[value.brand][0].id) },
      }))
    }
  }, [route, session.brand, session.cart])

  useEffect(() => sessionStorage.setItem('restprofi-demo-v2', JSON.stringify(session)), [session])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
    document.querySelector<HTMLElement>('.phone-content')?.scrollTo({ top: 0, behavior: 'instant' })
  }, [route])

  const go = (next: string) => {
    window.location.hash = next
    window.scrollTo({ top: 0, behavior: 'instant' })
  }
  const update = (patch: Partial<Session>) => setSession((value) => ({ ...value, ...patch }))
  const cartCount = itemCount(session.cart[session.brand])

  const page = useMemo(() => {
    if (route === '/') return <HomeScreen go={go} session={session} update={update} />
    if (route === '/order') return <OrderBrandScreen go={go} update={update} />
    if (route === '/search') return <SearchScreen go={go} session={session} />
    if (route === '/loyalty') return <LoyaltyScreen go={go} />
    if (route === '/history') return <HistoryScreen go={go} update={update} />
    if (route === '/profile') return <ProfileScreen go={go} />
    if (route === '/offers') return <OffersScreen go={go} />
    if (route === '/booking') return <BookingScreen go={go} session={session} update={update} />
    if (route === '/booking/success') return <BookingSuccess go={go} session={session} />
    if (route === '/cake') return <CakeScreen go={go} session={session} update={update} />
    if (route === '/cake/success') return <CakeSuccess go={go} session={session} />
    if (route === '/repeat') return <RepeatScreen go={go} session={session} update={update} />
    if (route === '/payment-error') return <PaymentError go={go} session={session} />
    if (route === '/order/success') return <OrderSuccess go={go} session={session} update={update} />
    if (route.startsWith('/brand/') && route.endsWith('/format')) return <FormatScreen go={go} session={session} update={update} />
    if (route.startsWith('/brand/') && route.endsWith('/menu')) return <MenuScreen go={go} session={session} update={update} />
    if (route.startsWith('/brand/')) return <BrandScreen go={go} session={session} />
    if (route.startsWith('/product/')) return <ProductScreen go={go} session={session} update={update} productId={route.split('/').pop() || ''} />
    if (route.startsWith('/cart/')) return <CartScreen go={go} session={session} update={update} />
    if (route.startsWith('/checkout/')) return <CheckoutScreen go={go} session={session} update={update} loading={loading} setLoading={setLoading} />
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

function DishArt({ item, large = false }: { item: { title: string; art: string }; large?: boolean }) {
  const icon = /торт|чизкейк|наполеон|бенто/i.test(item.title) ? <CakeSlice /> : /витрина/i.test(item.title) ? <IceCreamBowl /> : /омлет|буррата/i.test(item.title) ? <Sparkles /> : <UtensilsCrossed />
  return <span className={`${large ? 'product-art' : 'dish-art'} ${item.art}`} aria-hidden="true"><span className="food-plate">{icon}</span>{large && <i>визуальная концепция подачи</i>}</span>
}

function HomeScreen({ go, session, update }: { go: Go; session: Session; update: (p: Partial<Session>) => void }) {
  const pick = (id: BrandId) => { update({ brand: id }); go(`/brand/${id}`) }
  return <div className="screen home-screen">
    <div className="home-heading"><div><p className="eyebrow">Добрый день</p><h1>Что хочется<br />сегодня?</h1></div><button className="avatar" aria-label="Профиль" onClick={() => go('/profile')}><UserRound /></button></div>
    <button className="context-card" onClick={() => go(`/brand/${session.brand}/format`)}>
      <MapPin /><span><b>{session.service === 'delivery' ? 'Проверить доставку' : 'Изменить самовывоз'}</b><small>{session.address}</small></span><ChevronRight />
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

function OrderBrandScreen({ go, update }: { go: Go; update: (p: Partial<Session>) => void }) {
  const select = (brand: 'pitcofe' | 'mamadonna') => {
    update({ brand })
    go(`/brand/${brand}/format`)
  }
  return <div className="screen order-brand-screen"><ScreenHeader title="Заказ еды" go={go} /><p className="step">01 / Бренд</p><h1>Где хотите<br />сделать заказ?</h1><p className="lead">Меню, условия и корзина останутся внутри выбранного бренда.</p><div className="brand-stack order-brand-list">{(['pitcofe', 'mamadonna'] as const).map((id) => <button className={`brand-row brand-${brands[id].tone}`} key={id} onClick={() => select(id)}><BrandMark id={id} /><span><b>{brands[id].name}</b><small>{brands[id].note}</small></span><ChevronRight /></button>)}</div><div className="info-note"><ShoppingBag /><span><b>Корзины не смешиваются</b><small>Переход в другой бренд откроет его собственный контекст.</small></span></div></div>
}

function BrandScreen({ go, session }: { go: Go; session: Session }) {
  const brand = brands[session.brand]
  const experience = brandExperience[session.brand]
  return <div className={`screen brand-screen tone-${brand.tone}`}>
    <ScreenHeader title={brand.name} go={go} />
    <section className="brand-hero"><BrandMark id={session.brand} /><p>{experience.eyebrow}</p><h1>{experience.title.split('\n').map((line, index) => <span key={line}>{index > 0 && <br />}{line}</span>)}</h1><span>{experience.description}</span></section>
    <div className="brand-actions">
      {session.brand !== 'cream' && <button className="primary-action" onClick={() => go(session.brand === 'esttort' ? '/cake' : `/brand/${session.brand}/format`)}><ShoppingBag /><span><b>{session.brand === 'esttort' ? 'Собрать заявку на торт' : 'Доставка или самовывоз'}</b><small>{session.brand === 'esttort' ? 'категория, начинка, вес и дата' : 'сначала выберите формат'}</small></span><ArrowRight /></button>}
      {session.brand === 'mamadonna' && <button onClick={() => go('/booking')}><CalendarDays /><span><b>Запросить столик</b><small>дата, время и число гостей; требуется подтверждение</small></span><ChevronRight /></button>}
      {session.brand === 'cream' && <button className="primary-action" onClick={() => go(`/brand/${session.brand}/format`)}><MapPin /><span><b>Проверить адрес</b><small>не показываем неподтверждённую точку</small></span><ArrowRight /></button>}
      <button onClick={() => go('/offers')}><Sparkles /><span><b>Идеи для следующего визита</b><small>отдельные сценарии без смешивания корзин</small></span><ChevronRight /></button>
    </div>
    <button className="switch-brand" onClick={() => go('/')}>Сменить бренд</button>
  </div>
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
  const count = itemCount(session.cart[session.brand])
  const total = cartTotal(session.cart[session.brand], prices(session.brand))
  const add = (itemId: string) => update({
    cart: { ...session.cart, [session.brand]: addItem(session.cart[session.brand], itemId) },
  })
  return <div className="screen menu-screen">
    <ScreenHeader title={brands[session.brand].name} go={go} back={`/brand/${session.brand}/format`} />
    <button className="menu-context" onClick={() => go(`/brand/${session.brand}/format`)}><span><b>{session.service === 'delivery' ? 'Доставка' : 'Самовывоз'}</b><small>{session.address}</small></span><ChevronRight /></button>
    <div className="menu-title"><div><p className="eyebrow">Доступно сейчас</p><h1>Меню</h1></div><button aria-label="Поиск" onClick={() => go('/search')}><Search /></button></div>
    <div className="chips"><span className="active">Популярное</span><button onClick={() => go('/search')}>Основное</button><button onClick={() => go('/search')}>Десерты</button></div>
    <div className="dish-list">
      {items.map((item) => <article className="dish-card" key={item.id}><button className="dish-art-button" aria-label={`Открыть ${item.title}`} onClick={() => go(`/product/${item.id}`)}><DishArt item={item} /></button><div><button className="dish-title" onClick={() => go(`/product/${item.id}`)}>{item.title}</button><small>{item.meta}</small><footer><b>{item.price ? `${item.price} ₽` : 'Уточнить'}</b>{item.price ? <button aria-label={`Добавить ${item.title}`} onClick={() => add(item.id)}><Plus /></button> : <button aria-label="Открыть" onClick={() => go(`/product/${item.id}`)}><ArrowRight /></button>}</footer></div></article>)}
    </div>
    <p className="demo-caption">Ассортимент и цены собраны по открытым меню на 11.08.2026 и могут измениться.</p>
    {count > 0 && <button className="floating-cart" onClick={() => go(`/cart/${session.brand}`)}><span><ShoppingBag /> {count}</span><b>В корзину</b><span>{total ? `${total} ₽` : 'Уточнить'}</span></button>}
  </div>
}

function ProductScreen({ go, session, update, productId }: { go: Go; session: Session; update: (p: Partial<Session>) => void; productId: string }) {
  const item = dishes[session.brand].find((entry) => entry.id === productId) || dishes[session.brand][0]
  const [count, setCount] = useState(1)
  const add = () => {
    update({
      cart: { ...session.cart, [session.brand]: addItem(session.cart[session.brand], item.id, count) },
    })
    go(`/cart/${session.brand}`)
  }
  return <div className="screen product-screen">
    <ScreenHeader title={brands[session.brand].name} go={go} back={`/brand/${session.brand}/menu`} />
    <DishArt item={item} large />
    <p className="eyebrow">{item.meta}</p><h1>{item.title}</h1><p className="lead">Состав и доступность сверяются для выбранной точки перед оформлением.</p>
    <div className="option"><span><b>Стандартная подача</b><small>Без изменений</small></span><Check /></div>
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
      {lines.map(({ item, count: quantity }) => <article className="cart-item" key={item.id}>
        <div className={`mini-art ${item.art}`} />
        <span><b>{item.title}</b><small>Стандартная подача</small><em>{item.price ? `${item.price} ₽` : 'Цена уточняется'}</em></span>
        <div className="counter small"><button aria-label={`Уменьшить ${item.title}`} onClick={() => change(item.id, quantity - 1)}><Minus /></button><b>{quantity}</b><button aria-label={`Увеличить ${item.title}`} onClick={() => change(item.id, quantity + 1)}><Plus /></button></div>
      </article>)}
      <button className="add-more" onClick={() => go(`/brand/${session.brand}/menu`)}><Plus /> Добавить ещё из {brands[session.brand].name}</button>
      <div className="cart-summary"><span>Товары <b>{total ? `${total} ₽` : 'уточняются'}</b></span><span>{session.service === 'delivery' ? 'Доставка' : 'Самовывоз'} <b>{session.service === 'delivery' ? 'рассчитается далее' : '0 ₽'}</b></span><strong>Итого <b>{total ? `${total} ₽` : 'после уточнения'}</b></strong></div>
      <p className="safe-note">Корзина сохранится, даже если оплата завершится ошибкой.</p>
      <button className="cta" onClick={() => go(`/checkout/${session.brand}`)}>К оформлению <ArrowRight /></button>
    </>}
  </div>
}

function CheckoutScreen({ go, session, update, loading, setLoading }: { go: Go; session: Session; update: (p: Partial<Session>) => void; loading: boolean; setLoading: (v: boolean) => void }) {
  const [time, setTime] = useState('Ближайшее время')
  const [now, setNow] = useState(() => new Date())
  useEffect(() => { const timer = window.setInterval(() => setNow(new Date()), 60_000); return () => window.clearInterval(timer) }, [])
  const intervalOptions = upcomingOrderIntervals(now)
  const validTime = time === 'Ближайшее время' || intervalOptions.includes(time)
  const [card, setCard] = useState('Карта •• 2481')
  const [editing, setEditing] = useState<'time' | 'payment' | null>(null)
  const [name, setName] = useState('Гость')
  const [phone, setPhone] = useState('+7 900 000-00-00')
  const lines = cartEntries(session, session.brand)
  const total = cartTotal(session.cart[session.brand], prices(session.brand))
  const validContacts = name.trim().length >= 2 && phone.replace(/\D/g, '').length >= 6
  const pay = () => {
    setLoading(true)
    window.setTimeout(() => {
      setLoading(false)
      if (!session.paymentFailed) { update({ paymentFailed: true }); go('/payment-error') }
      else go('/order/success')
    }, 650)
  }
  return <div className="screen checkout-screen">
    <ScreenHeader title="Оформление" go={go} back={`/cart/${session.brand}`} />
    <p className="step">03 / Подтверждение</p><h1>Проверьте заказ</h1>
    <div className="checkout-block"><span>{session.service === 'delivery' ? <Truck /> : <Store />}<b>{session.service === 'delivery' ? 'Доставка' : 'Самовывоз'}</b></span><small>{session.address}</small><button onClick={() => go(`/brand/${session.brand}/format`)}>Изменить</button></div>
    <div className="checkout-block"><span><Clock3 /><b>{time}</b></span><small>Интервал подтвердит оператор</small><button onClick={() => setEditing('time')}>Выбрать</button></div>
    <div className="checkout-block"><span><CreditCard /><b>{card}</b></span><small>Без реального списания</small><button onClick={() => setEditing('payment')}>Выбрать</button></div>
    {editing && <div className="choice-sheet" role="dialog" aria-label={editing === 'time' ? 'Выбор времени' : 'Выбор оплаты'}><div><b>{editing === 'time' ? 'Когда получить заказ' : 'Способ оплаты'}</b><button aria-label="Закрыть" onClick={() => setEditing(null)}>×</button></div>{(editing === 'time' ? ['Ближайшее время', ...intervalOptions] : ['Карта •• 2481', 'При получении']).map((value) => <button className={(editing === 'time' ? time : card) === value ? 'active' : ''} key={value} onClick={() => { if (editing === 'time') setTime(value); else setCard(value); setEditing(null) }}>{value}<Check /></button>)}</div>}
    <h2>Состав заказа</h2>{lines.map(({ item, count }) => <div className="checkout-order" key={item.id}><div className={`mini-art ${item.art}`} /><span><b>{item.title}</b><small>{count} × {item.price ? `${item.price} ₽` : 'цена уточняется'}</small></span><strong>{item.price ? `${item.price * count} ₽` : 'уточняется'}</strong></div>)}
    <h2>Контакты</h2><div className="contact-fields"><label><span>Имя</span><input value={name} onChange={(event) => setName(event.target.value)} /></label><label><span>Телефон</span><input inputMode="tel" value={phone} onChange={(event) => setPhone(event.target.value)} /></label></div>
    <div className="total"><span>К оплате</span><b>{total ? `${total} ₽` : 'уточняется'}</b></div>
    <button className="cta" disabled={loading || !validContacts || !validTime} onClick={pay}>{loading ? <><span className="spinner" /> Проверяем…</> : <>Подтвердить заказ <ArrowRight /></>}</button>
    {!validContacts && <p className="field-error">Укажите имя и телефон, чтобы продолжить.</p>}
    {!validTime && <p className="field-error">Выбранный интервал уже прошёл. Укажите другое время.</p>}
  </div>
}

function PaymentError({ go, session }: { go: Go; session: Session }) {
  return <div className="screen status-screen error-screen"><div className="status-icon"><CircleAlert /></div><p className="eyebrow">Оплата не завершена</p><h1>Корзина на месте</h1><p>Позиции, адрес и формат сохранены. Можно вернуться к оплате без повторного сбора заказа.</p><div className="saved-cart"><BrandMark id={session.brand} small /><span><b>{brands[session.brand].name}</b><small>{itemCount(session.cart[session.brand])} шт. · параметры сохранены</small></span><Check /></div><button className="cta" onClick={() => go(`/checkout/${session.brand}`)}>Вернуться к оплате</button><button className="text-button" onClick={() => go(`/cart/${session.brand}`)}>Изменить корзину</button></div>
}

function OrderSuccess({ go, session, update }: { go: Go; session: Session; update: (p: Partial<Session>) => void }) {
  return <div className="screen status-screen success-screen"><div className="status-icon"><PackageCheck /></div><p className="eyebrow">Сценарий завершён</p><h1>Заказ подтверждён</h1><p>№ RP-1042 · {brands[session.brand].name}<br />Статус сохранён в истории действий.</p><div className="timeline"><i /><span><b>Принят</b><small>12:42</small></span><i /><span><b>Готовим</b><small>следующий этап</small></span></div><button className="cta" onClick={() => { update({ cart: { ...session.cart, [session.brand]: {} }, paymentFailed: false }); go('/') }}>На главный экран</button><button className="text-button" onClick={() => go('/history')}>История заказов</button></div>
}

function BookingScreen({ go, session, update }: { go: Go; session: Session; update: (p: Partial<Session>) => void }) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => { const timer = window.setInterval(() => setNow(new Date()), 60_000); return () => window.clearInterval(timer) }, [])
  const bookingDates = bookingDateOptions(now)
  const bookingTimes = ['18:30', '19:00', '19:30', '20:00']
  const validBooking = isFutureBookingTime(session.booking.date, session.booking.time, now)
  const booking = session.booking
  const change = (patch: Partial<Session['booking']>) => update({ booking: { ...booking, ...patch } })
  return <div className="screen booking-screen"><ScreenHeader title="Запрос столика" go={go} /><p className="step">Запрос</p><h1>Выберите удобные<br />параметры визита</h1><p className="lead">Дата и время рассчитываются от текущего дня. Финальную доступность подтвердит ресторан.</p><h2>Ресторан</h2><div className="brand-pills">{(['mamadonna', 'pitcofe'] as const).map((id) => <button className={booking.brand === id ? 'active' : ''} key={id} onClick={() => change({ brand: id })}><BrandMark id={id} small /><span><b>{brands[id].name}</b><small>{id === 'mamadonna' ? 'Красноармейская, 64' : '«Библиотека»'}</small></span></button>)}</div><h2>Дата</h2><div className="chips booking-chips">{bookingDates.map((value) => <button className={booking.date === value ? 'active' : ''} key={value} onClick={() => change({ date: value })}>{value}</button>)}</div><h2>Время</h2><div className="time-grid">{bookingTimes.map((value) => <button className={booking.time === value ? 'active' : ''} disabled={!isFutureBookingTime(booking.date, value, now)} key={value} onClick={() => change({ time: value })}>{value}</button>)}</div><div className="guest-row"><span><UsersRound /><b>Количество гостей</b></span><div className="counter"><button aria-label="Уменьшить" onClick={() => change({ guests: Math.max(1, booking.guests - 1) })}><Minus /></button><b>{booking.guests}</b><button aria-label="Увеличить" onClick={() => change({ guests: booking.guests + 1 })}><Plus /></button></div></div><button className="cta" disabled={!validBooking} onClick={() => go('/booking/success')}>Сохранить запрос <ArrowRight /></button>{!validBooking && <p className="field-error">Выберите будущие дату и время.</p>}</div>
}

function BookingSuccess({ go, session }: { go: Go; session: Session }) {
  const { brand, date, time, guests } = session.booking
  const address = brand === 'mamadonna' ? 'ул. Красноармейская, 64' : '«Библиотека»'
  return <div className="screen status-screen success-screen booking-success"><div className="status-icon"><CalendarDays /></div><p className="eyebrow">Запрос сохранён</p><h1>{brands[brand].name}<br />{date.toLowerCase()} в {time}</h1><p>{guests} {guestWord(guests)} · {address}<br />Ресторан должен подтвердить доступность.</p><div className="ticket"><span>Номер запроса</span><b>{brand === 'mamadonna' ? 'MD' : 'PK'}–{time.replace(':', '')}</b></div><button className="cta" onClick={() => go('/')}>Готово</button><button className="text-button" onClick={() => go('/booking')}>Изменить параметры</button></div>
}

function guestWord(guests: number) {
  if (guests % 10 === 1 && guests % 100 !== 11) return 'гость'
  if ([2, 3, 4].includes(guests % 10) && ![12, 13, 14].includes(guests % 100)) return 'гостя'
  return 'гостей'
}

function CakeScreen({ go, session, update }: { go: Go; session: Session; update: (p: Partial<Session>) => void }) {
  const cakeDates = cakeDateOptions()
  const cake = session.cake
  const change = (patch: Partial<Session['cake']>) => update({ cake: { ...cake, ...patch } })
  return <div className="screen cake-screen"><ScreenHeader title="Заказ торта" go={go} /><div className="cake-hero"><CakeSlice /><p>ЕстьТорт</p><h1>Торт для вашего<br />повода</h1></div><p className="step">Минимум за 3 дня</p><h2>Категория</h2><div className="chips">{['Праздничный', 'Детский', 'Свадебный'].map((value) => <button className={cake.kind === value ? 'active' : ''} onClick={() => change({ kind: value })} key={value}>{value}</button>)}</div><h2>Начинка</h2><div className="choice-list">{['Чёрный лес', 'Сан-Себастьян', 'Оникс'].map((value) => <button className={cake.filling === value ? 'active' : ''} onClick={() => change({ filling: value })} key={value}><span><b>{value}</b><small>состав уточняется с кондитером</small></span>{cake.filling === value && <Check />}</button>)}</div><h2>Вес и дата</h2><div className="two-fields"><button onClick={() => change({ weight: cake.weight === '2 кг' ? '3 кг' : '2 кг' })}><small>Вес · изменить</small><b>{cake.weight}</b></button><button onClick={() => change({ date: cake.date === cakeDates[0] ? cakeDates[1] : cakeDates[0] })}><small>Дата · изменить</small><b>{cake.date}</b></button></div><div className="info-note"><CircleAlert /><span><b>Итог требует подтверждения</b><small>Декор, стоимость и доступность согласует кондитер.</small></span></div><button className="cta" onClick={() => go('/cake/success')}>Сохранить заявку <ArrowRight /></button></div>
}

function CakeSuccess({ go, session }: { go: Go; session: Session }) {
  const cakeDates = cakeDateOptions()
  const { kind, filling, weight, date } = session.cake
  return <div className="screen status-screen cake-success"><div className="status-icon"><CakeSlice /></div><p className="eyebrow">Параметры сохранены</p><h1>Осталось<br />согласовать детали</h1><p>{kind} · «{filling}» · {weight}<br />К {date}</p><div className="ticket"><span>Заявка</span><b>ET–{String(cakeDates.indexOf(date) + 1).padStart(2, '0')}</b></div><button className="cta" onClick={() => go('/')}>На главный экран</button><button className="text-button" onClick={() => go('/cake')}>Изменить параметры</button></div>
}

function ProfileScreen({ go }: { go: Go }) {
  const [saved, setSaved] = useState(false)
  const [name, setName] = useState('Гость')
  const [phone, setPhone] = useState('+7 ')
  return <div className="screen profile-screen"><ScreenHeader title="Профиль" go={go} /><p className="eyebrow">Личные данные</p><h1>Контакты<br />для оформления</h1><p className="lead">Данные хранятся только в текущей вкладке прототипа и помогают пройти сценарий оформления.</p><label className="profile-field"><span>Имя</span><input value={name} onChange={(event) => { setName(event.target.value); setSaved(false) }} /></label><label className="profile-field"><span>Телефон</span><input inputMode="tel" value={phone} onChange={(event) => { setPhone(event.target.value); setSaved(false) }} /></label><button className="cta" disabled={!name.trim() || phone.replace(/\D/g, '').length < 6} onClick={() => setSaved(true)}>{saved ? <><Check /> Сохранено</> : 'Сохранить контакты'}</button><div className="profile-links"><button onClick={() => go('/history')}><History /><span><b>История действий</b><small>заказы и запросы столика</small></span><ChevronRight /></button><button onClick={() => go('/loyalty')}><TicketCheck /><span><b>Карты лояльности</b><small>правила каждого бренда отдельно</small></span><ChevronRight /></button></div></div>
}

function HistoryScreen({ go, update }: { go: Go; update: (p: Partial<Session>) => void }) {
  return <div className="screen history-screen"><ScreenHeader title="Мои действия" go={go} /><p className="eyebrow">История</p><h1>Вернуться<br />к привычному</h1><article className="history-card"><div><BrandMark id="pitcofe" small /><span><b>Питькофе</b><small>{formatKrasnodarDate(-4)} · доставка</small></span></div><h3>Карбонара, борщ с говядиной</h3><footer><b>1 058 ₽</b><button onClick={() => { update({ brand: 'pitcofe' }); go('/repeat') }}>Повторить <ArrowRight /></button></footer></article><h2>Посещения</h2><article className="visit-card"><Star /><span><b>MamaDonna</b><small>{formatKrasnodarDate(-9)} · 2 гостя</small></span><button onClick={() => go('/booking')}>Снова</button></article><div className="empty compact"><History /><h3>Других заказов пока нет</h3><p>Здесь появятся заказы и запросы каждого бренда.</p></div></div>
}

function RepeatScreen({ go, session, update }: { go: Go; session: Session; update: (p: Partial<Session>) => void }) {
  const [checked, setChecked] = useState(false)
  const repeat = () => {
    setChecked(true)
    update({ brand: 'pitcofe', cart: { ...session.cart, pitcofe: { carbonara: 1, borsch: 1 } } })
  }
  return <div className="screen repeat-screen"><ScreenHeader title="Повтор заказа" go={go} back="/history" /><p className="step">Проверка перед корзиной</p><h1>Почти как<br />в прошлый раз</h1><p className="lead">Цена и доступность проверяются заново для выбранного адреса.</p><div className="repeat-list"><span><Check /><b>Карбонара</b><em>529 ₽</em></span><span><Check /><b>Борщ с говядиной</b><em>529 ₽</em></span><span className="unavailable"><CircleAlert /><b>Домашний лимонад</b><em>недоступен</em></span></div>{checked && <div className="success-note"><Check /><span><b>2 позиции добавлены</b><small>Недоступная позиция пропущена. Корзина относится только к Питькофе.</small></span></div>}<button className="cta" onClick={checked ? () => go('/cart/pitcofe') : repeat}>{checked ? 'Открыть корзину' : 'Проверить и повторить'} <ArrowRight /></button></div>
}

function LoyaltyScreen({ go }: { go: Go }) {
  const [brand, setBrand] = useState<BrandId>('pitcofe')
  return <div className="screen loyalty-screen"><ScreenHeader title="Лояльность" go={go} /><p className="step">Концепция</p><h1>Карты рядом.<br />Правила раздельно.</h1><p className="lead">Общий баланс между брендами не предполагается без проверки внутренних правил.</p><div className="loyalty-brands">{(['pitcofe', 'mamadonna'] as BrandId[]).map((id) => <button className={brand === id ? 'active' : ''} key={id} onClick={() => setBrand(id)}><BrandMark id={id} small />{brands[id].name}</button>)}</div><div className={`loyalty-card ${brands[brand].tone}`}><span><BrandMark id={brand} small /><small>Карта бренда</small></span><div className="qr-demo" aria-label="Код карты"><i /><i /><i /><i /><i /><i /><i /><i /><i /></div><footer><span><small>Баланс</small><b>уточняется</b></span><BadgePercent /></footer></div><div className="info-note"><TicketCheck /><span><b>Проверить перед пилотом</b><small>Начисление, списание, срок действия и возможность переноса карт между каналами.</small></span></div></div>
}

function OffersScreen({ go }: { go: Go }) {
  return <div className="screen offers-screen"><ScreenHeader title="Для вас" go={go} /><p className="eyebrow">Следующий шаг</p><h1>Продолжить внутри<br />нужного бренда</h1><article className="offer-main"><span>Питькофе</span><h2>Повторить обед<br />без поиска по меню</h2><button onClick={() => go('/repeat')}>Повторить заказ <ArrowRight /></button></article><h2>Выбрать другой сценарий</h2><button className="cross-offer tomato" onClick={() => go('/booking')}><BrandMark id="mamadonna" small /><span><b>Запросить столик в MamaDonna</b><small>Указать дату, время и гостей; доступность подтвердит ресторан</small></span><ChevronRight /></button><button className="cross-offer berry" onClick={() => go('/cake')}><BrandMark id="esttort" small /><span><b>Торт к событию</b><small>Выбрать параметры отдельной заявки ЕстьТорт</small></span><ChevronRight /></button></div>
}

function SearchScreen({ go, session }: { go: Go; session: Session }) {
  const [query, setQuery] = useState('')
  const results = query.trim() ? dishes[session.brand].filter((item) => `${item.title} ${item.meta}`.toLocaleLowerCase('ru').includes(query.trim().toLocaleLowerCase('ru'))) : []
  return <div className="screen search-screen"><ScreenHeader title="Поиск" go={go} back={`/brand/${session.brand}/menu`} /><label className="search-box"><Search /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Блюдо или категория" /></label>{query.trim() ? (results.length ? <div className="search-results">{results.map((item) => <div className="search-result" key={item.id}><div className={`mini-art ${item.art}`} /><span><b>{item.title}</b><small>{brands[session.brand].name} · {item.price ? `${item.price} ₽` : 'цена уточняется'}</small></span><button aria-label={`Открыть ${item.title}`} onClick={() => go(`/product/${item.id}`)}><ArrowRight /></button></div>)}</div> : <div className="empty"><Search /><h1>Ничего не нашлось</h1><p>Попробуйте другое название внутри {brands[session.brand].name}.</p></div>) : <div className="empty"><Search /><h1>Что найти?</h1><p>Поиск работает внутри {brands[session.brand].name} и не смешивает меню.</p></div>}</div>
}

function NotFound({ go }: { go: Go }) {
  return <div className="screen status-screen"><div className="status-icon"><CircleAlert /></div><h1>Экран не найден</h1><p>Вернитесь на главный экран и выберите сценарий.</p><button className="cta" onClick={() => go('/')}>На главный экран</button></div>
}

function BottomNav({ route, go, cartCount, brand }: { route: string; go: Go; cartCount: number; brand: BrandId }) {
  return <nav className="bottom-nav" aria-label="Основная навигация"><button className={route === '/' ? 'active' : ''} onClick={() => go('/')}><Home /><span>Главная</span></button><button className={route.includes('/menu') ? 'active' : ''} onClick={() => go(`/brand/${brand}/menu`)}><Coffee /><span>Меню</span></button><button className={route.includes('/cart') ? 'active' : ''} onClick={() => go(`/cart/${brand}`)}><span className="icon-wrap"><ShoppingBag />{cartCount > 0 && <i>{cartCount}</i>}</span><span>Корзина</span></button><button className={route === '/history' ? 'active' : ''} onClick={() => go('/history')}><History /><span>История</span></button></nav>
}
