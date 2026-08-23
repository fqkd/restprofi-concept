import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import {
  ArrowDown, ArrowRight, BadgeCheck, CalendarDays, CakeSlice, Check,
  ChevronLeft, ChevronRight, CircleAlert, Coffee, ExternalLink,
  Layers3, Mail, MapPin, PackageCheck, Play, ShoppingBag, Sparkles,
  Store, Truck, UsersRound,
} from 'lucide-react'

const prototype = '../#'

const sections = [
  'Предложение', 'Исследование', 'Точки роста', 'Идея', 'Заказ', 'Бронирование',
  'Торт', 'Архитектура', 'Пилот', 'ЭРГОХАВЭН', 'Следующий шаг',
]

export function CasePage() {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
      if (visible) setActive(Number((visible.target as HTMLElement).dataset.index || 0))
    }, { threshold: [.35, .55] })
    document.querySelectorAll<HTMLElement>('.case-section').forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [])

  const move = (index: number) => document.getElementById(`section-${Math.max(0, Math.min(sections.length - 1, index))}`)?.scrollIntoView({ behavior: 'smooth' })

  return <div className="case-page">
    <header className="case-header"><a className="case-logo" href="#section-0"><span>RP</span><b>RestProfi × Ergohaven</b></a><div className="case-count">{String(active + 1).padStart(2, '0')} <i /> {String(sections.length).padStart(2, '0')}</div><a className="prototype-link" href={`${prototype}/`}><Play /> Прототип</a></header>
    <aside className="case-dots" aria-label="Навигация по презентации">{sections.map((title, index) => <button className={active === index ? 'active' : ''} onClick={() => move(index)} key={title} aria-label={title}><span>{title}</span><i /></button>)}</aside>
    <div className="case-controls"><button aria-label="Предыдущий раздел" disabled={active === 0} onClick={() => move(active - 1)}><ChevronLeft /></button><button aria-label="Следующий раздел" disabled={active === sections.length - 1} onClick={() => move(active + 1)}><ChevronRight /></button></div>

    <section className="case-section cover" id="section-0" data-index="0">
      <div className="cover-copy"><p className="case-eyebrow">Инициативная концепция · 11 августа 2026</p><h1>Сначала задача.<br /><em>Потом бренд.</em></h1><p className="case-lead">Мобильный вход в сервисы УК «РестПрофи», где доставка, бронирование и заказ торта остаются в контексте конкретного бренда.</p><div className="button-row"><a className="case-button dark" href={`${prototype}/`}><Play /> Открыть прототип</a><button className="case-button light" onClick={() => move(1)}>Как пришли к идее <ArrowDown /></button></div></div>
      <div className="cover-visual" aria-label="Схема концепции"><div className="orbit-card orbit-main"><span>RP</span><b>Выберите задачу</b><small>заказ · столик · торт</small></div><div className="orbit-card brand-one"><i>ПК</i><b>Питькофе</b></div><div className="orbit-card brand-two"><i>MD</i><b>MamaDonna</b></div><div className="orbit-card brand-three"><i>ЕТ</i><b>ЕстьТорт</b></div><svg viewBox="0 0 600 600" aria-hidden="true"><circle cx="300" cy="300" r="218"/><circle cx="300" cy="300" r="140"/></svg></div>
      <FooterMark number="01" />
    </section>

    <section className="case-section research" id="section-1" data-index="1">
      <div className="section-heading"><p className="case-eyebrow">Что было изучено</p><h2>Публичный контур уже<br />состоит из разных задач</h2></div>
      <div className="fact-grid">
        <article><Coffee /><b>Питькофе</b><p>Официальный сайт показывает доставку, навынос, меню и кофейни в нескольких городах. Действующее приложение найдено в App Store и Google Play.</p><small>pitcofe.ru · магазины приложений</small></article>
        <article><Store /><b>MamaDonna</b><p>На официальном сайте доступны доставка, навынос, заказ в кафе, два адреса и отдельные правила бонусной программы.</p><small>mamadonna.ru</small></article>
        <article><CakeSlice /><b>ЕстьТорт и Cream</b><p>ЕстьТорт предлагает отдельный каталог тортов и согласование заказа. Официальная страница ЕстьТорт также упоминает витрину Cream.</p><small>esttort.ru</small></article>
        <article className="fact-note"><BadgeCheck /><b>Граница достоверности</b><p>Связь Питькофе с ООО «УК РестПрофи» подтверждается карточкой App Store. Актуальный состав всей группы и общность правил лояльности требуют внутреннего подтверждения.</p><small>Проверено 11.08.2026</small></article>
      </div>
      <FooterMark number="02" />
    </section>

    <section className="case-section pains" id="section-2" data-index="2">
      <div className="section-heading"><p className="case-eyebrow">Проверяемые точки роста</p><h2>Сценарий начинается<br />с нужного действия</h2></div>
      <div className="pain-layout"><div className="quote-stack"><blockquote>Завершение оформления<small>Отдельный отзыв App Store упоминает незавершённый заказ, 01.06.2026</small></blockquote><blockquote>Поиск и дополнения к заказу<small>Отдельный отзыв Google Play, проверено 11.08.2026</small></blockquote><blockquote>Состояние после отправки заказа<small>Отдельный отзыв Google Play упоминает длительную загрузку</small></blockquote></div><div className="hypothesis"><CircleAlert /><p>Отдельные отзывы используются только для формулировки гипотез и не описывают частоту проблем.</p><ol><li><span>01</span>Можно ли раньше зафиксировать формат и точку?</li><li><span>02</span>Сохранится ли корзина после ошибки?</li><li><span>03</span>Сократится ли повтор привычного заказа?</li></ol></div></div>
      <FooterMark number="03" />
    </section>

    <section className="case-section idea" id="section-3" data-index="3">
      <div className="section-heading"><p className="case-eyebrow">Основная идея</p><h2>Общая оболочка<br />не смешивает бренды</h2><p>На входе — выбор задачи. После выбора бренда — собственные меню, условия, корзина и история.</p></div>
      <div className="flow-map"><div className="flow-start"><Sparkles /><b>Что хочется?</b><small>первое действие</small></div><div className="flow-line" /><div className="flow-choice"><span><ShoppingBag />Заказать</span><span><CalendarDays />Столик</span><span><CakeSlice />Торт</span></div><div className="flow-line" /><div className="flow-brands"><span className="amber">Питькофе</span><span className="red">MamaDonna</span><span className="berry">ЕстьТорт</span></div></div>
      <div className="principles"><p><Check /> Корзина принадлежит одному бренду</p><p><Check /> Рекомендация переводит в новый контекст</p><p><Check /> Правила лояльности показаны раздельно</p></div>
      <FooterMark number="04" />
    </section>

    <section className="case-section scenario order" id="section-4" data-index="4">
      <div className="section-heading"><p className="case-eyebrow">Ключевой сценарий № 1</p><h2>Заказ начинается<br />с условий получения</h2><p>Формат и адрес определяют доступное меню до того, как пользователь наполнит корзину. Для самовывоза работает интерактивная карта подтверждённых точек с поиском и синхронным списком.</p><a className="case-button dark" href={`${prototype}/brand/pitcofe/format`}><Play /> Посмотреть сценарий</a></div>
      <div className="scenario-steps"><Step icon={<Truck />} n="01" title="Формат" text="Доставка или самовывоз" /><Step icon={<MapPin />} n="02" title="Карта" text="Поиск и выбор реальной точки" /><Step icon={<Coffee />} n="03" title="Меню" text="Доступное для выбранного контекста" /><Step icon={<ShoppingBag />} n="04" title="Корзина" text="Только позиции одного бренда" /></div>
      <PhoneMock kind="order" />
      <FooterMark number="05" />
    </section>

    <section className="case-section scenario booking" id="section-5" data-index="5">
      <div className="section-heading"><p className="case-eyebrow">Ключевой сценарий № 2</p><h2>Бронирование<br />без звонка в прототипе</h2><p>Ресторан → дата → время → гости → понятное подтверждение. Данные остаются безопасной симуляцией.</p><a className="case-button dark" href={`${prototype}/booking`}><Play /> Посмотреть сценарий</a></div>
      <div className="booking-timeline"><div><b>19:30</b><small>выбранное время</small></div><i /><div><b>2 гостя</b><small>один явный параметр</small></div><i /><div><b>Подтверждено</b><small>финальное состояние</small></div></div>
      <PhoneMock kind="booking" />
      <FooterMark number="06" />
    </section>

    <section className="case-section scenario cake" id="section-6" data-index="6">
      <div className="section-heading"><p className="case-eyebrow">Ключевой сценарий № 3</p><h2>Для торта —<br />отдельный путь заказа</h2><p>Категория, начинка, вес и дата формируют заявку. Декор, цена и доступность остаются предметом подтверждения кондитером.</p><a className="case-button cream-button" href={`${prototype}/cake`}><Play /> Посмотреть сценарий</a></div>
      <div className="cake-spec"><CakeSlice /><div><span>01</span><b>Повод</b><small>праздничный, детский, свадебный</small></div><div><span>02</span><b>Основа</b><small>начинка и вес</small></div><div><span>03</span><b>Срок</b><small>дата и контакт для согласования</small></div></div>
      <PhoneMock kind="cake" />
      <FooterMark number="07" />
    </section>

    <section className="case-section architecture" id="section-7" data-index="7">
      <div className="section-heading"><p className="case-eyebrow">Связь с бизнесом</p><h2>Единый вход там,<br />где это удобно пользователю</h2></div>
      <div className="architecture-grid"><article className="shell-card"><Layers3 /><h3>Общая оболочка</h3><ul><li>выбор задачи</li><li>переключение бренда</li><li>история действий</li><li>персональные рекомендации</li></ul></article><article className="brand-card"><Coffee /><h3>Контекст бренда</h3><ul><li>своё меню</li><li>свои условия получения</li><li>отдельная корзина</li><li>свои правила лояльности</li></ul></article><article className="restore-card"><PackageCheck /><h3>Восстановление</h3><p>После демонстрационной ошибки сохраняются корзина, адрес и формат. Возврат к оплате открывается с этими параметрами.</p><a href={`${prototype}/payment-error`}>Открыть состояние <ArrowRight /></a></article></div>
      <FooterMark number="08" />
    </section>

    <section className="case-section pilot" id="section-8" data-index="8">
      <div className="section-heading"><p className="case-eyebrow">Предлагаемый пилот</p><h2>Сравнить путь<br />до и после</h2><p>Начать с Питькофе: доставка/самовывоз, повтор заказа и восстановление корзины. Параллельно проверить бронирование MamaDonna и заявку ЕстьТорт.</p></div>
      <div className="metric-list"><Metric n="01" title="Завершение действия" text="Конверсия из начатого оформления в подтверждённый заказ или бронь" /><Metric n="02" title="Скорость" text="Время и количество шагов основного сценария" /><Metric n="03" title="Восстановление" text="Доля корзин, продолженных после ошибки" /><Metric n="04" title="Возврат" text="Завершение повторного заказа и использование истории" /><Metric n="05" title="Связь брендов" text="Переход из рекомендации в сценарий другого бренда" /></div>
      <p className="pilot-note">Целевые проценты определяются только после доступа к текущей аналитике. Концепция не обещает гарантированный коммерческий эффект.</p>
      <FooterMark number="09" />
    </section>

    <section className="case-section eh" id="section-9" data-index="9">
      <div className="section-heading"><p className="case-eyebrow">Что берём на себя</p><h2>ООО «ЭРГОХАВЭН» —<br />полный цикл работ</h2><p>Аккредитованная ИТ-компания из Краснодара. Можно начать с пилота по нескольким приоритетным сценариям.</p></div>
      <div className="service-wheel"><div><b>01</b><span>Продуктовая<br />аналитика</span></div><div><b>02</b><span>UX/UI-<br />дизайн</span></div><div><b>03</b><span>Разработка<br />и интеграции</span></div><div><b>04</b><span>Публикация<br />и обновления</span></div><div><b>05</b><span>Техническая<br />поддержка</span></div><i>EH</i></div>
      <div className="eh-fact"><BadgeCheck /><span><b>От концепции до поддержки</b><small>Состав и сроки интеграций определяются после обследования действующих систем.</small></span></div>
      <FooterMark number="10" />
    </section>

    <section className="case-section contact" id="section-10" data-index="10">
      <div className="contact-copy"><p className="case-eyebrow">Следующий шаг</p><h2>Покажем прототип<br />лично и выберем пилот</h2><p>Обсудим 2–3 приоритетных сценария, зафиксируем ограничения текущих систем и соберём план проверки на внутренних данных. Можем лично приехать и показать прототип команде.</p><div className="button-row"><a className="case-button lime" href="mailto:hello@eh.works"><Mail /> hello@eh.works</a><a className="case-button outline" href="https://eh.works" target="_blank" rel="noreferrer">eh.works <ExternalLink /></a><a className="case-button outline" href="https://t.me/andrey_ergohaven" target="_blank" rel="noreferrer">Telegram · @andrey_ergohaven <ExternalLink /></a><a className="case-button outline" href="https://max.ru/id5041212966_biz" target="_blank" rel="noreferrer">MAX · +7 988 154-04-00 <ExternalLink /></a></div></div>
      <div className="contact-card"><span>ООО «ЭРГОХАВЭН»</span><b>Краснодар<br />аккредитованная<br />ИТ-компания</b><small>Продуктовая аналитика · UX/UI · разработка · интеграции · публикация · обновления · техническая поддержка</small><i>EH</i></div>
      <p className="disclaimer">Инициативная концепция ООО «ЭРГОХАВЭН», созданная на основе открытых данных. Не является официальным продуктом УК «РестПрофи» или упомянутых брендов. Все действия в прототипе — безопасная симуляция.</p>
      <FooterMark number="11" />
    </section>
  </div>
}

function FooterMark({ number }: { number: string }) { return <div className="footer-mark"><span>RESTPROFI CONCEPT</span><i /><b>{number}</b></div> }

function Step({ icon, n, title, text }: { icon: ReactNode; n: string; title: string; text: string }) { return <article><span>{icon}</span><small>{n}</small><b>{title}</b><p>{text}</p></article> }

function Metric({ n, title, text }: { n: string; title: string; text: string }) { return <article><span>{n}</span><b>{title}</b><p>{text}</p></article> }

function PhoneMock({ kind }: { kind: 'order' | 'booking' | 'cake' }) {
  return <div className={`case-phone ${kind}`}><div className="case-phone-top"><span>12:42</span><i /></div>{kind === 'order' && <><small>ПИТЬКОФЕ · ФОРМАТ</small><h3>Как получить<br />заказ?</h3><div className="mock-options"><span><Truck /><b>Доставка</b></span><span><Store /><b>Самовывоз</b></span></div><div className="mock-location"><MapPin /><span><b>ул. Пушкинская, 120 · демо</b><small>условия уточняются</small></span><Check /></div><span className="mock-button">Смотреть меню</span></>}{kind === 'booking' && <><small>БРОНИРОВАНИЕ</small><h3>MamaDonna</h3><div className="mock-date"><CalendarDays /><span><small>Сегодня</small><b>19:30</b></span></div><div className="mock-guests"><UsersRound /><b>2 гостя</b><Check /></div><span className="mock-button">Подтвердить бронь</span></>}{kind === 'cake' && <><small>ЕСТЬТОРТ</small><h3>Торт для<br />вашего повода</h3><div className="mock-cake"><CakeSlice /></div><div className="mock-specs"><span>Праздничный</span><span>2 кг</span><span>15 августа</span></div><span className="mock-button">Сформировать заявку</span></>}</div>
}
