import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft, ArrowRight, BadgePercent, CalendarDays, CakeSlice, Check,
  ChevronRight, CircleAlert, Clock3, Coffee, CreditCard, History,
  Home, MapPin, Minus, PackageCheck, Plus, Search, ShoppingBag,
  Sparkles, Star, Store, TicketCheck, Truck, UserRound, UsersRound,
} from 'lucide-react'

type BrandId = 'pitcofe' | 'mamadonna' | 'esttort' | 'cream'
type Service = 'delivery' | 'pickup'

type Session = {
  brand: BrandId
  service: Service
  cart: Record<BrandId, number>
  paymentFailed: boolean
  address: string
}

const brands: Record<BrandId, { name: string; note: string; tone: string; monogram: string }> = {
  pitcofe: { name: 'Питькофе', note: 'кофейни · доставка · навынос', tone: 'amber', monogram: 'ПК' },
  mamadonna: { name: 'MamaDonna', note: 'гастрокафе · столик · доставка', tone: 'tomato', monogram: 'MD' },
  esttort: { name: 'ЕстьТорт', note: 'торты и кондитерские изделия', tone: 'berry', monogram: 'ЕТ' },
  cream: { name: 'Cream', note: 'кондитерская · визит', tone: 'cream', monogram: 'CR' },
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

const initialSession: Session = {
  brand: 'pitcofe',
  service: 'delivery',
  cart: { pitcofe: 0, mamadonna: 0, esttort: 0, cream: 0 },
  paymentFailed: false,
  address: 'ул. Пушкинская, 120',
}

function readSession(): Session {
  try {
    return { ...initialSession, ...JSON.parse(sessionStorage.getItem('restprofi-demo') || '{}') }
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
    if (route === '/payment-error' && session.cart[session.brand] === 0) {
      setSession((value) => ({
        ...value,
        paymentFailed: true,
        cart: { ...value.cart, [value.brand]: 1 },
      }))
    }
  }, [route, session.brand, session.cart])

  useEffect(() => sessionStorage.setItem('restprofi-demo', JSON.stringify(session)), [session])

  const go = (next: string) => {
    window.location.hash = next
    window.scrollTo({ top: 0, behavior: 'instant' })
  }
  const update = (patch: Partial<Session>) => setSession((value) => ({ ...value, ...patch }))
  const cartCount = session.cart[session.brand]

  const page = useMemo(() => {
    if (route === '/') return <HomeScreen go={go} session={session} update={update} />
    if (route === '/search') return <SearchScreen go={go} />
    if (route === '/loyalty') return <LoyaltyScreen go={go} />
    if (route === '/history') return <HistoryScreen go={go} update={update} />
    if (route === '/offers') return <OffersScreen go={go} />
    if (route === '/booking') return <BookingScreen go={go} />
    if (route === '/booking/success') return <BookingSuccess go={go} />
    if (route === '/cake') return <CakeScreen go={go} />
    if (route === '/cake/success') return <CakeSuccess go={go} />
    if (route === '/repeat') return <RepeatScreen go={go} session={session} update={update} />
    if (route === '/payment-error') return <PaymentError go={go} session={session} />
    if (route === '/order/success') return <OrderSuccess go={go} session={session} update={update} />
    if (route.startsWith('/brand/') && route.endsWith('/format')) return <FormatScreen go={go} session={session} update={update} />
    if (route.startsWith('/brand/') && route.endsWith('/menu')) return <MenuScreen go={go} session={session} update={update} />
    if (route.startsWith('/brand/')) return <BrandScreen go={go} session={session} update={update} />
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
  return <span className={`brand-mark ${brand.tone} ${small ? 'small' : ''}`}>{brand.monogram}</span>
}

function HomeScreen({ go, session, update }: { go: Go; session: Session; update: (p: Partial<Session>) => void }) {
  const pick = (id: BrandId) => { update({ brand: id }); go(`/brand/${id}`) }
  return <div className="screen home-screen">
    <div className="home-heading"><div><p className="eyebrow">Добрый день</p><h1>Что хочется<br />сегодня?</h1></div><button className="avatar" aria-label="Профиль" onClick={() => go('/history')}><UserRound /></button></div>
    <button className="context-card" onClick={() => go(`/brand/${session.brand}/format`)}>
      <MapPin /><span><b>{session.service === 'delivery' ? 'Доставка' : 'Самовывоз'}</b><small>{session.address}</small></span><ChevronRight />
    </button>
    <div className="task-grid">
      <button className="task task-order" onClick={() => go(`/brand/${session.brand}/format`)}><ShoppingBag /><b>Заказать еду</b><span>доставка или навынос</span></button>
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

function BrandScreen({ go, session, update }: { go: Go; session: Session; update: (p: Partial<Session>) => void }) {
  const brand = brands[session.brand]
  return <div className={`screen brand-screen tone-${brand.tone}`}>
    <ScreenHeader title="Пространство бренда" go={go} />
    <section className="brand-hero"><BrandMark id={session.brand} /><p>Сегодня выбираете</p><h1>{brand.name}</h1><span>{brand.note}</span></section>
    <div className="brand-actions">
      <button className="primary-action" onClick={() => go(`/brand/${session.brand}/format`)}><ShoppingBag /><span><b>Доставка или самовывоз</b><small>сначала выберите формат</small></span><ArrowRight /></button>
      {(session.brand === 'mamadonna' || session.brand === 'pitcofe') && <button onClick={() => go('/booking')}><CalendarDays /><span><b>Забронировать столик</b><small>законченный сценарий</small></span><ChevronRight /></button>}
      {(session.brand === 'esttort' || session.brand === 'cream') && <button onClick={() => go('/cake')}><CakeSlice /><span><b>Заказать торт</b><small>начинка, вес и дата</small></span><ChevronRight /></button>}
      <button onClick={() => go('/offers')}><Sparkles /><span><b>Предложения</b><small>в контексте выбранного бренда</small></span><ChevronRight /></button>
    </div>
    <button className="switch-brand" onClick={() => { update({ brand: 'pitcofe' }); go('/') }}>Сменить бренд</button>
  </div>
}

function FormatScreen({ go, session, update }: { go: Go; session: Session; update: (p: Partial<Session>) => void }) {
  return <div className="screen format-screen">
    <ScreenHeader title={brands[session.brand].name} go={go} back={`/brand/${session.brand}`} />
    <p className="step">01 / Формат</p><h1>Как получить заказ?</h1><p className="lead">Формат определяет доступное меню и условия до наполнения корзины.</p>
    <div className="segmented">
      <button className={session.service === 'delivery' ? 'active' : ''} onClick={() => update({ service: 'delivery' })}><Truck /><b>Доставка</b><small>от 60 минут</small></button>
      <button className={session.service === 'pickup' ? 'active' : ''} onClick={() => update({ service: 'pickup' })}><Store /><b>Самовывоз</b><small>от 20 минут</small></button>
    </div>
    <h2>{session.service === 'delivery' ? 'Куда доставить' : 'Где забрать'}</h2>
    <button className="location-choice" onClick={() => update({ address: session.service === 'delivery' ? 'ул. Пушкинская, 120' : '«Библиотека», ул. Пушкинская, 120А' })}><MapPin /><span><b>{session.service === 'delivery' ? session.address : '«Библиотека»'}</b><small>{session.service === 'delivery' ? 'Ростов-на-Дону · зона уточнена' : 'ул. Пушкинская, 120А · доступен навынос'}</small></span><Check /></button>
    <div className="info-note"><Clock3 /><span><b>Условия показаны заранее</b><small>Фактическое время и минимальная сумма зависят от адреса и загрузки точки.</small></span></div>
    <button className="cta" onClick={() => go(`/brand/${session.brand}/menu`)}>Смотреть доступное меню <ArrowRight /></button>
  </div>
}

function MenuScreen({ go, session, update }: { go: Go; session: Session; update: (p: Partial<Session>) => void }) {
  const items = dishes[session.brand]
  const add = () => update({ cart: { ...session.cart, [session.brand]: session.cart[session.brand] + 1 } })
  return <div className="screen menu-screen">
    <ScreenHeader title={brands[session.brand].name} go={go} back={`/brand/${session.brand}/format`} />
    <button className="menu-context" onClick={() => go(`/brand/${session.brand}/format`)}><span><b>{session.service === 'delivery' ? 'Доставка' : 'Самовывоз'}</b><small>{session.address}</small></span><ChevronRight /></button>
    <div className="menu-title"><div><p className="eyebrow">Доступно сейчас</p><h1>Меню</h1></div><button aria-label="Поиск" onClick={() => go('/search')}><Search /></button></div>
    <div className="chips"><button className="active">Популярное</button><button onClick={() => go('/search')}>Основное</button><button onClick={() => go('/search')}>Десерты</button></div>
    <div className="dish-list">
      {items.map((item) => <article className="dish-card" key={item.id}><button className={`dish-art ${item.art}`} aria-label={`Открыть ${item.title}`} onClick={() => go(`/product/${item.id}`)}><span>{item.title.slice(0, 1)}</span></button><div><button className="dish-title" onClick={() => go(`/product/${item.id}`)}>{item.title}</button><small>{item.meta}</small><footer><b>{item.price ? `${item.price} ₽` : 'Уточнить'}</b>{item.price ? <button aria-label={`Добавить ${item.title}`} onClick={add}><Plus /></button> : <button aria-label="Открыть" onClick={() => go(`/product/${item.id}`)}><ArrowRight /></button>}</footer></div></article>)}
    </div>
    <p className="demo-caption">Ассортимент и цены показаны как демонстрационное содержимое по открытым меню на 10.08.2026.</p>
    {session.cart[session.brand] > 0 && <button className="floating-cart" onClick={() => go(`/cart/${session.brand}`)}><span><ShoppingBag /> {session.cart[session.brand]}</span><b>В корзину</b><span>649 ₽</span></button>}
  </div>
}

function ProductScreen({ go, session, update, productId }: { go: Go; session: Session; update: (p: Partial<Session>) => void; productId: string }) {
  const item = dishes[session.brand].find((entry) => entry.id === productId) || dishes[session.brand][0]
  const [count, setCount] = useState(1)
  const add = () => { update({ cart: { ...session.cart, [session.brand]: session.cart[session.brand] + count } }); go(`/cart/${session.brand}`) }
  return <div className="screen product-screen">
    <ScreenHeader title={brands[session.brand].name} go={go} back={`/brand/${session.brand}/menu`} />
    <div className={`product-art ${item.art}`}><span>{item.title.slice(0, 1)}</span><i>демо-подача</i></div>
    <p className="eyebrow">{item.meta}</p><h1>{item.title}</h1><p className="lead">Состав и доступность сверяются для выбранной точки. Демонстрационная карточка не оформляет реальный заказ.</p>
    <div className="option"><span><b>Стандартная подача</b><small>Без изменений</small></span><Check /></div>
    <div className="product-buy"><div className="counter"><button aria-label="Уменьшить" onClick={() => setCount(Math.max(1, count - 1))}><Minus /></button><b>{count}</b><button aria-label="Увеличить" onClick={() => setCount(count + 1)}><Plus /></button></div><button className="cta" onClick={add}>Добавить · {item.price * count} ₽</button></div>
  </div>
}

function CartScreen({ go, session, update }: { go: Go; session: Session; update: (p: Partial<Session>) => void }) {
  const count = session.cart[session.brand]
  return <div className="screen cart-screen">
    <ScreenHeader title="Корзина" go={go} back={`/brand/${session.brand}/menu`} />
    <div className="cart-brand"><BrandMark id={session.brand} small /><span><b>{brands[session.brand].name}</b><small>Отдельный заказ бренда</small></span></div>
    {count === 0 ? <div className="empty"><ShoppingBag /><h1>Корзина пока пуста</h1><p>Выберите позиции в меню этого бренда.</p><button className="cta" onClick={() => go(`/brand/${session.brand}/menu`)}>Перейти в меню</button></div> : <>
      <article className="cart-item"><div className="mini-art art-sage" /><span><b>{dishes[session.brand][0].title}</b><small>Стандартная подача</small><em>649 ₽</em></span><div className="counter small"><button aria-label="Уменьшить" onClick={() => update({ cart: { ...session.cart, [session.brand]: Math.max(0, count - 1) } })}><Minus /></button><b>{count}</b><button aria-label="Увеличить" onClick={() => update({ cart: { ...session.cart, [session.brand]: count + 1 } })}><Plus /></button></div></article>
      <button className="add-more" onClick={() => go(`/brand/${session.brand}/menu`)}><Plus /> Добавить ещё из {brands[session.brand].name}</button>
      <div className="cart-summary"><span>Товары <b>{649 * count} ₽</b></span><span>Доставка <b>рассчитается далее</b></span><strong>Итого <b>{649 * count} ₽</b></strong></div>
      <p className="safe-note">Корзина сохранится в демосессии, даже если оплата завершится ошибкой.</p>
      <button className="cta" onClick={() => go(`/checkout/${session.brand}`)}>К оформлению <ArrowRight /></button>
    </>}
  </div>
}

function CheckoutScreen({ go, session, update, loading, setLoading }: { go: Go; session: Session; update: (p: Partial<Session>) => void; loading: boolean; setLoading: (v: boolean) => void }) {
  const [time, setTime] = useState('Ближайшее время')
  const [card, setCard] = useState('Карта •• 2481')
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
    <div className="checkout-block"><span><Truck /><b>{session.service === 'delivery' ? 'Доставка' : 'Самовывоз'}</b></span><small>{session.address}</small><button onClick={() => go(`/brand/${session.brand}/format`)}>Изменить</button></div>
    <div className="checkout-block"><span><Clock3 /><b>{time}</b></span><small>Интервал подтвердит оператор</small><button onClick={() => setTime(time === 'Ближайшее время' ? 'Сегодня, 14:30–15:00' : 'Ближайшее время')}>Изменить</button></div>
    <div className="checkout-block"><span><CreditCard /><b>{card}</b></span><small>Без реального списания</small><button onClick={() => setCard(card === 'Карта •• 2481' ? 'При получении' : 'Карта •• 2481')}>Изменить</button></div>
    <div className="total"><span>К оплате</span><b>{649 * session.cart[session.brand]} ₽</b></div>
    <button className="cta" disabled={loading} onClick={pay}>{loading ? <><span className="spinner" /> Проверяем…</> : <>Подтвердить демозаказ <ArrowRight /></>}</button>
    <p className="demo-caption">Нажатие безопасно: заказ и оплата не отправляются.</p>
  </div>
}

function PaymentError({ go, session }: { go: Go; session: Session }) {
  return <div className="screen status-screen error-screen"><div className="status-icon"><CircleAlert /></div><p className="eyebrow">Оплата не завершена</p><h1>Корзина на месте</h1><p>Позиции, адрес и формат сохранены. Можно вернуться к оплате без повторного сбора заказа.</p><div className="saved-cart"><BrandMark id={session.brand} small /><span><b>{brands[session.brand].name}</b><small>{session.cart[session.brand]} позиция · параметры сохранены</small></span><Check /></div><button className="cta" onClick={() => go(`/checkout/${session.brand}`)}>Вернуться к оплате</button><button className="text-button" onClick={() => go(`/cart/${session.brand}`)}>Изменить корзину</button></div>
}

function OrderSuccess({ go, session, update }: { go: Go; session: Session; update: (p: Partial<Session>) => void }) {
  return <div className="screen status-screen success-screen"><div className="status-icon"><PackageCheck /></div><p className="eyebrow">Демонстрация завершена</p><h1>Заказ подтверждён</h1><p>№ RP-1042 · {brands[session.brand].name}<br />Статус сохранён внутри прототипа.</p><div className="timeline"><i /><span><b>Принят</b><small>12:42</small></span><i /><span><b>Готовим</b><small>следующий этап</small></span></div><button className="cta" onClick={() => { update({ cart: { ...session.cart, [session.brand]: 0 }, paymentFailed: false }); go('/') }}>На главный экран</button><button className="text-button" onClick={() => go('/history')}>История заказов</button></div>
}

function BookingScreen({ go }: { go: Go }) {
  const [brand, setBrand] = useState<BrandId>('mamadonna')
  const [date, setDate] = useState('Сегодня')
  const [time, setTime] = useState('19:30')
  const [guests, setGuests] = useState(2)
  return <div className="screen booking-screen"><ScreenHeader title="Бронирование" go={go} /><p className="step">Столик</p><h1>Вечер начинается<br />с контекста</h1><p className="lead">Выберите бренд, затем дату, время и число гостей.</p><h2>Ресторан</h2><div className="brand-pills">{(['mamadonna', 'pitcofe'] as BrandId[]).map((id) => <button className={brand === id ? 'active' : ''} key={id} onClick={() => setBrand(id)}><BrandMark id={id} small /><span><b>{brands[id].name}</b><small>{id === 'mamadonna' ? 'Красноармейская, 64' : 'Библиотека'}</small></span></button>)}</div><h2>Дата</h2><div className="chips booking-chips">{['Сегодня', 'Завтра', '12 авг.'].map((value) => <button className={date === value ? 'active' : ''} key={value} onClick={() => setDate(value)}>{value}</button>)}</div><h2>Время</h2><div className="time-grid">{['18:30', '19:00', '19:30', '20:00'].map((value) => <button className={time === value ? 'active' : ''} key={value} onClick={() => setTime(value)}>{value}</button>)}</div><div className="guest-row"><span><UsersRound /><b>Количество гостей</b></span><div className="counter"><button aria-label="Уменьшить" onClick={() => setGuests(Math.max(1, guests - 1))}><Minus /></button><b>{guests}</b><button aria-label="Увеличить" onClick={() => setGuests(guests + 1)}><Plus /></button></div></div><button className="cta" onClick={() => go('/booking/success')}>Подтвердить демобронь <ArrowRight /></button></div>
}

function BookingSuccess({ go }: { go: Go }) {
  return <div className="screen status-screen success-screen booking-success"><div className="status-icon"><CalendarDays /></div><p className="eyebrow">Столик выбран</p><h1>MamaDonna<br />сегодня в 19:30</h1><p>2 гостя · ул. Красноармейская, 64<br />Данные не отправлены в ресторан.</p><div className="ticket"><span>Код демоброни</span><b>MD–1930</b></div><button className="cta" onClick={() => go('/')}>Готово</button></div>
}

function CakeScreen({ go }: { go: Go }) {
  const [kind, setKind] = useState('Праздничный')
  const [filling, setFilling] = useState('Черный лес')
  const [weight, setWeight] = useState('2 кг')
  return <div className="screen cake-screen"><ScreenHeader title="Заказ торта" go={go} /><div className="cake-hero"><CakeSlice /><p>ЕстьТорт</p><h1>Торт для вашего<br />повода</h1></div><p className="step">Отдельный сценарий</p><h2>Категория</h2><div className="chips">{['Праздничный', 'Детский', 'Свадебный'].map((v) => <button className={kind === v ? 'active' : ''} onClick={() => setKind(v)} key={v}>{v}</button>)}</div><h2>Начинка</h2><div className="choice-list">{['Черный лес', 'Сан-Себастьян', 'Оникс'].map((v) => <button className={filling === v ? 'active' : ''} onClick={() => setFilling(v)} key={v}><span><b>{v}</b><small>состав уточняется с кондитером</small></span>{filling === v && <Check />}</button>)}</div><h2>Вес и дата</h2><div className="two-fields"><button onClick={() => setWeight(weight === '2 кг' ? '3 кг' : '2 кг')}><small>Вес</small><b>{weight}</b></button><button><small>Дата</small><b>15 августа</b></button></div><div className="info-note"><CircleAlert /><span><b>Итог требует подтверждения</b><small>Декор, стоимость и доступность согласует кондитер. Прототип не отправляет заявку.</small></span></div><button className="cta" onClick={() => go('/cake/success')}>Сформировать демозаявку <ArrowRight /></button></div>
}

function CakeSuccess({ go }: { go: Go }) {
  return <div className="screen status-screen cake-success"><div className="status-icon"><CakeSlice /></div><p className="eyebrow">Параметры сохранены</p><h1>Осталось<br />согласовать детали</h1><p>Праздничный · «Черный лес» · 2 кг<br />К 15 августа</p><div className="ticket"><span>Демозаявка</span><b>ET–0815</b></div><button className="cta" onClick={() => go('/')}>На главный экран</button><button className="text-button" onClick={() => go('/cake')}>Изменить параметры</button></div>
}

function HistoryScreen({ go, update }: { go: Go; update: (p: Partial<Session>) => void }) {
  return <div className="screen history-screen"><ScreenHeader title="Мои действия" go={go} /><p className="eyebrow">История</p><h1>Вернуться<br />к привычному</h1><article className="history-card"><div><BrandMark id="pitcofe" small /><span><b>Питькофе</b><small>8 августа · доставка</small></span></div><h3>Карбонара, борщ с говядиной</h3><footer><b>1 058 ₽</b><button onClick={() => { update({ brand: 'pitcofe' }); go('/repeat') }}>Повторить <ArrowRight /></button></footer></article><h2>Посещения</h2><article className="visit-card"><Star /><span><b>MamaDonna</b><small>2 августа · 2 гостя</small></span><button onClick={() => go('/booking')}>Снова</button></article><div className="empty compact"><History /><h3>Других заказов пока нет</h3><p>Здесь появятся заказы и бронирования каждого бренда.</p></div></div>
}

function RepeatScreen({ go, session, update }: { go: Go; session: Session; update: (p: Partial<Session>) => void }) {
  const [checked, setChecked] = useState(false)
  const repeat = () => { setChecked(true); update({ brand: 'pitcofe', cart: { ...session.cart, pitcofe: 2 } }) }
  return <div className="screen repeat-screen"><ScreenHeader title="Повтор заказа" go={go} back="/history" /><p className="step">Проверка перед корзиной</p><h1>Почти как<br />в прошлый раз</h1><p className="lead">Цена и доступность проверяются заново для выбранного адреса.</p><div className="repeat-list"><span><Check /><b>Карбонара</b><em>529 ₽</em></span><span><Check /><b>Борщ с говядиной</b><em>529 ₽</em></span><span className="unavailable"><CircleAlert /><b>Домашний лимонад</b><em>недоступен</em></span></div>{checked && <div className="success-note"><Check /><span><b>2 позиции добавлены</b><small>Недоступная позиция пропущена. Корзина относится только к Питькофе.</small></span></div>}<button className="cta" onClick={checked ? () => go('/cart/pitcofe') : repeat}>{checked ? 'Открыть корзину' : 'Проверить и повторить'} <ArrowRight /></button></div>
}

function LoyaltyScreen({ go }: { go: Go }) {
  const [brand, setBrand] = useState<BrandId>('pitcofe')
  return <div className="screen loyalty-screen"><ScreenHeader title="Лояльность" go={go} /><p className="step">Концепция</p><h1>Карты рядом.<br />Правила раздельно.</h1><p className="lead">Общий баланс между брендами не предполагается без проверки внутренних правил.</p><div className="loyalty-brands">{(['pitcofe', 'mamadonna'] as BrandId[]).map((id) => <button className={brand === id ? 'active' : ''} key={id} onClick={() => setBrand(id)}><BrandMark id={id} small />{brands[id].name}</button>)}</div><div className={`loyalty-card ${brands[brand].tone}`}><span><BrandMark id={brand} small /><small>Демонстрационная карта</small></span><div className="qr-demo" aria-label="Демонстрационный код"><i /><i /><i /><i /><i /><i /><i /><i /><i /></div><footer><span><small>Баланс</small><b>уточняется</b></span><BadgePercent /></footer></div><div className="info-note"><TicketCheck /><span><b>Проверить перед пилотом</b><small>Начисление, списание, срок действия и возможность переноса карт между каналами.</small></span></div></div>
}

function OffersScreen({ go }: { go: Go }) {
  return <div className="screen offers-screen"><ScreenHeader title="Для вас" go={go} /><p className="eyebrow">Разные поводы</p><h1>Продолжить внутри<br />нужного бренда</h1><article className="offer-main"><span>Питькофе</span><h2>Повторить обед<br />без поиска по меню</h2><button onClick={() => go('/repeat')}>Повторить заказ <ArrowRight /></button></article><h2>Другие задачи группы</h2><button className="cross-offer tomato" onClick={() => go('/booking')}><BrandMark id="mamadonna" small /><span><b>Ужин в MamaDonna</b><small>Перейти к бронированию, не смешивая корзины</small></span><ChevronRight /></button><button className="cross-offer berry" onClick={() => go('/cake')}><BrandMark id="esttort" small /><span><b>Торт к событию</b><small>Открыть отдельный сценарий ЕстьТорт</small></span><ChevronRight /></button></div>
}

function SearchScreen({ go }: { go: Go }) {
  const [query, setQuery] = useState('')
  return <div className="screen search-screen"><ScreenHeader title="Поиск" go={go} back="/brand/pitcofe/menu" /><label className="search-box"><Search /><input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Блюдо или категория" /></label>{query ? <div className="search-result"><div className="mini-art art-sun" /><span><b>Карбонара</b><small>Питькофе · 529 ₽</small></span><button onClick={() => go('/product/carbonara')}><ArrowRight /></button></div> : <div className="empty"><Search /><h1>Что найти?</h1><p>Поиск работает внутри выбранного бренда и не смешивает меню.</p></div>}</div>
}

function NotFound({ go }: { go: Go }) {
  return <div className="screen status-screen"><div className="status-icon"><CircleAlert /></div><h1>Экран не найден</h1><p>Вернитесь на главный экран и выберите сценарий.</p><button className="cta" onClick={() => go('/')}>На главный экран</button></div>
}

function BottomNav({ route, go, cartCount, brand }: { route: string; go: Go; cartCount: number; brand: BrandId }) {
  return <nav className="bottom-nav" aria-label="Основная навигация"><button className={route === '/' ? 'active' : ''} onClick={() => go('/')}><Home /><span>Главная</span></button><button className={route.includes('/menu') ? 'active' : ''} onClick={() => go(`/brand/${brand}/menu`)}><Coffee /><span>Меню</span></button><button className={route.includes('/cart') ? 'active' : ''} onClick={() => go(`/cart/${brand}`)}><span className="icon-wrap"><ShoppingBag />{cartCount > 0 && <i>{cartCount}</i>}</span><span>Корзина</span></button><button className={route === '/history' ? 'active' : ''} onClick={() => go('/history')}><History /><span>История</span></button></nav>
}
