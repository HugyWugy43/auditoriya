import { useEffect, useState, type CSSProperties } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Icon from './Icon'
import { api } from '../services/api'
import Dialog from './Dialog'
import useCampus from '../hooks/useCampus'
import { campusDate, dayBookings, localDate, roomState, roomTypes, time, roles } from '../utils/booking'
import type { Booking, Room, RoomState, RoomType, User } from '../types'

type RoomMode = 'overview' | 'rooms' | 'schedule' | 'favorites'
type AvailabilityFilter = '' | RoomState['key']

interface TimelineProps {
 rooms: Room[]
 bookings: Booking[]
 day: string
 onSelect: (room: Room) => void
 now: Date
}

interface RoomsProps {
 currentUser: User
 mode?: RoomMode
}

function Timeline({ rooms, bookings, day, onSelect, now }: TimelineProps) {
 const list = dayBookings(bookings, day)
 const midnight = campusDate(`${day}T00:00:00`).getTime()
 const outside = list.some(b => campusDate(b.startTime).getTime() < midnight + 8 * 3600000 || campusDate(b.endTime).getTime() > midnight + 22 * 3600000)
 const firstHour = outside ? 0 : 8, lastHour = outside ? 24 : 22
 const start = midnight + firstHour * 3600000, duration = (lastHour - firstHour) * 3600000
 const ticks = Array.from({length: outside ? 7 : 8}, (_,i) => firstHour + i * (outside ? 4 : 2))
 const offset = (value: string | Date) => Math.max(0, Math.min(100, (campusDate(value).getTime() - start) / duration * 100))
 const today = day === localDate(now)
 return <div className="timeline-scroll"><div className="timeline" style={{ "--grid-step": `${100 / (ticks.length - 1)}%` } as CSSProperties}><div className="timeline-header"><span>АУДИТОРИЯ</span><div>{ticks.map(h => <span key={h}>{String(h).padStart(2, '0')}:00</span>)}</div></div>
  {rooms.map((room, index) => <div className="timeline-row" key={room.id}><button className="timeline-room" onClick={() => onSelect(room)}><span className={`room-symbol tone-${index % 4}`}><Icon name={room.type.includes('LAB') ? 'lab' : 'room'} size={17}/></span><span>{room.roomNumber}<small>{roomTypes[room.type]}</small></span></button><div className="timeline-track">{list.filter(b => b.roomId === room.id).map(b => <button key={b.id} className={`time-block tone-${index % 4}`} title={`${b.purpose || room.name}: ${time(b.startTime)}–${time(b.endTime)}`} aria-label={`${room.roomNumber}, ${b.purpose || 'Занятие'}, ${time(b.startTime)}–${time(b.endTime)}`} style={{ left: `${offset(b.startTime)}%`, width: `${offset(b.endTime) - offset(b.startTime)}%` }} onClick={() => onSelect(room)}><strong>{time(b.startTime)}</strong><span>{b.purpose || 'Занятие'}</span></button>)}{today && now.getTime() >= start && now.getTime() <= start + duration && <span className="now-line" style={{ left: `${offset(now)}%` }}/>}</div></div>)}
  {!rooms.length && <div className="empty-state">Нет аудиторий для отображения</div>}
 </div></div>
}

export default function Rooms({ currentUser, mode = 'overview' }: RoomsProps) {
 const [params, setParams] = useSearchParams()
 const query = params.get('q') || ''
 const [type, setType] = useState<RoomType | ''>(''), [status, setStatus] = useState<AvailabilityFilter>(''), [capacity, setCapacity] = useState(''), [day, setDay] = useState(localDate()), [selected, setSelected] = useState<Room | null>(null), [now, setNow] = useState(new Date())
 const { rooms: allRooms, bookings, loading, error, updated, refreshing, refresh } = useCampus(day)
 const rooms = allRooms.filter(r => !r.archived)
 const [favorites, setFavorites] = useState<number[]>([])
 const [storageError, setStorageError] = useState('')
 useEffect(() => { const timer = setInterval(() => setNow(new Date()), 15000); return () => clearInterval(timer) }, [])
 useEffect(() => { let active = true; api.getSubscriptions().then(r => { if (active) setFavorites(r.data) }).catch(() => { if (active) setStorageError('Не удалось загрузить избранное. Повторите позже.') }); return () => { active = false } }, [])
 const toggleFavorite = async (id: number) => { try { if (favorites.includes(id)) await api.unsubscribe(id); else await api.subscribe(id); const r = await api.getSubscriptions(); setFavorites(r.data); setStorageError('') } catch { setStorageError('Не удалось сохранить подписку. Повторите попытку.') } }
 const canBook = ['ADMIN', 'TEACHER'].includes(currentUser.role)
 const states = Object.fromEntries(rooms.map(r => [r.id, roomState(r, bookings, now)])) as Record<number, RoomState>
 const free = rooms.filter(r => states[r.id].key === 'free').length, busy = rooms.filter(r => states[r.id].key === 'busy').length
 const todayList = dayBookings(bookings, localDate(now))
 const mine = todayList.filter(b => b.userId === currentUser.id && campusDate(b.endTime) > now)
 const filtered = rooms.filter(r => (!query || `${r.roomNumber} ${r.name} ${r.description || ''}`.toLowerCase().includes(query.toLowerCase())) && (!type || r.type === type) && (!status || states[r.id].key === status) && (!capacity || r.capacity >= Number(capacity)) && (mode !== 'favorites' || favorites.includes(r.id))).sort((a,b) => a.roomNumber.localeCompare(b.roomNumber, 'ru', { numeric: true }))
 const visible = mode === 'overview' ? filtered.slice(0, 5) : filtered
 const title: Record<RoomMode, string> = { overview: `Здравствуйте, ${currentUser.firstName || currentUser.username}`, rooms: 'Аудитории кампуса', schedule: 'Расписание занятий', favorites: 'Ваше избранное' }
 const description: Record<RoomMode, string> = { overview: 'Всё для продуктивного учебного дня — в одном месте.', rooms: 'Найдите подходящее пространство для вашего занятия.', schedule: 'Весь день на одной шкале. Планируйте без пересечений.', favorites: 'Аудитории, за которыми вы следите. Синхронизируются с аккаунтом. Об изменениях сообщим в уведомлениях.' }
 const selectedState = selected ? roomState(selected, bookings, now) : null
 const occupancy = rooms.filter(r => r.isActive).length ? Math.round(busy / rooms.filter(r => r.isActive).length * 100) : 0
  const stats = [
   { label: 'Всего аудиторий', value: rooms.length, icon: 'room', caption: 'Пространства для обучения' },
   { label: 'Свободны сейчас', value: free, icon: 'check', caption: 'Готовы к вашему занятию' },
   { label: 'Заняты сейчас', value: busy, icon: 'clock', caption: 'Занятия уже идут' },
   { label: 'Занятий сегодня', value: todayList.length, icon: 'calendar', caption: 'По расписанию кампуса' },
  ] as const
  return <>
  <div className="page-heading"><div><span className="eyebrow">{mode === 'overview' ? 'ВАШ УЧЕБНЫЙ ДЕНЬ' : 'ПРОСТРАНСТВА КАМПУСА'}</span><h1>{title[mode]}<span className="heading-dot">.</span></h1><p>{description[mode]}</p></div>{canBook && <Link className="btn btn-primary" to="/create-booking"><Icon name="plus" size={18}/>Новая бронь</Link>}</div>
   <div className="status-line"><span><span className={`live-dot ${error ? 'offline' : ''}`}/>{error ? 'Нет актуальных данных' : loading ? 'Подключение к кампусу…' : updated ? `Обновлено в ${time(updated)} · каждые 30 сек.` : 'Данные загружены'}</span><button className="text-button" onClick={refresh} disabled={refreshing}><Icon name="refresh" size={14} className={refreshing ? 'spinning' : ''}/>{refreshing ? 'Обновляем' : 'Обновить'}</button></div>
  {error && <div className="error" role="alert">{error}</div>}{storageError && <div className="error" role="alert">{storageError}</div>}
  {loading ? <div className="loading-grid" aria-label="Загрузка данных">{[0,1,2,3].map(i => <div className="skeleton" key={i}/>)}</div> : <>
  <section className="stats-grid" aria-label="Состояние кампуса">
    {stats.map((stat, i) => <div className={`stat-card tone-${i}`} key={stat.label}><div><span>{stat.label}</span><Icon name={stat.icon}/></div><strong>{error ? '—' : stat.value.toString().padStart(2, '0')}</strong><small>{stat.caption}</small><span className="stat-decoration"/></div>)}
  </section>
  <div className={mode === 'overview' ? 'dashboard-grid' : ''}><div className="dashboard-main">
   {(mode === 'overview' || mode === 'schedule') && <section className="panel schedule-panel"><div className="section-heading"><div><h2>Ритм кампуса</h2><p>Занятость аудиторий в течение дня</p></div><label className="date-control"><Icon name="calendar" size={16}/><input type="date" aria-label="Дата расписания" value={day} onChange={e => { if (e.target.value) setDay(e.target.value) }}/></label></div><Timeline rooms={mode === 'overview' ? rooms.slice(0,4) : filtered} bookings={bookings} day={day} onSelect={setSelected} now={now}/><div className="timeline-footer"><span><i className="legend-dot"/>Забронировано <i className="legend-line"/>Текущее время</span>{mode === 'overview' && <Link to="/schedule">Всё расписание <Icon name="arrow" size={15}/></Link>}</div></section>}
   <section className="panel rooms-panel"><div className="section-heading"><div><h2>{mode === 'favorites' ? 'Отслеживаемые аудитории' : 'Найдите своё пространство'}</h2><p>{filtered.length} из {rooms.length} аудиторий · статус на текущий момент</p></div><Icon name="settings"/></div>
     <div className="filter-row"><label className="search-field"><Icon name="search" size={17}/><input aria-label="Поиск по номеру или названию" placeholder="Номер, название…" value={query} onChange={e => setParams(e.target.value ? { q: e.target.value } : {}, { replace: true })}/></label><select aria-label="Тип аудитории" value={type} onChange={e => setType(e.target.value as RoomType | '')}><option value="">Все типы</option>{Object.entries(roomTypes).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select><select aria-label="Доступность" value={status} onChange={e => setStatus(e.target.value as AvailabilityFilter)}><option value="">Любой статус</option><option value="free">Свободны сейчас</option><option value="busy">Заняты</option><option value="offline">Недоступны</option></select><input className="capacity-input" type="number" min="1" placeholder="Мест от" aria-label="Минимальная вместимость" value={capacity} onChange={e => setCapacity(e.target.value)}/></div>
    <div className="room-list">{visible.map((room, i) => { const state = states[room.id]; return <article className="room-row" key={room.id}><button className="room-identity" onClick={() => setSelected(room)}><span className={`room-symbol tone-${i % 4}`}><Icon name={room.type.includes('LAB') ? 'lab' : 'room'}/></span><span><strong>{room.roomNumber} <span className="room-name">· {room.name}</span></strong><small>{roomTypes[room.type]} · {room.capacity} мест</small></span></button><div className="room-availability"><span className={`status-pill ${error ? 'offline' : state.key}`}><i/>{error ? 'Неизвестно' : state.label}</span><small>{error ? 'Требуется обновление' : state.current ? `До ${time(state.current.endTime)}` : state.next ? `Запланировано ${campusDate(state.next.startTime).toLocaleDateString('ru-RU', { day:'numeric', month:'short' })}, ${time(state.next.startTime)}` : room.isActive ? 'Сегодня занятий больше нет' : 'Бронирование закрыто'}</small></div><button className={`icon-button favorite ${favorites.includes(room.id) ? 'selected' : ''}`} aria-pressed={favorites.includes(room.id)} aria-label={`${favorites.includes(room.id) ? 'Убрать из избранного' : 'В избранное'}: ${room.roomNumber}`} onClick={() => toggleFavorite(room.id)}><Icon name="star"/></button><button className="icon-button" aria-label={`Подробнее об аудитории ${room.roomNumber}`} onClick={() => setSelected(room)}><Icon name="arrow" size={18}/></button></article> })}</div>
    {!filtered.length && <div className="empty-state"><Icon name={mode === 'favorites' ? 'star' : 'search'} size={32}/><h3>{mode === 'favorites' && !favorites.length ? 'Здесь будут ваши аудитории' : 'Аудитории не найдены'}</h3><p>{mode === 'favorites' && !favorites.length ? 'Нажмите на звёздочку в каталоге, чтобы следить за аудиторией.' : 'Попробуйте изменить поиск или фильтры.'}</p><button className="text-button" onClick={() => { setParams({}); setType(''); setStatus(''); setCapacity('') }}>Сбросить фильтры</button>{mode === 'favorites' && <Link className="btn btn-secondary" to="/rooms">Открыть каталог</Link>}</div>}
    {mode === 'overview' && <Link className="panel-footer-link" to="/rooms">Все аудитории <Icon name="arrow" size={16}/></Link>}
   </section>
  </div>
  {mode === 'overview' && <aside className="day-aside"><section className="personal-panel"><span className="eyebrow">ЛИЧНЫЙ ПЛАН</span><div className="personal-greeting"><span className="avatar large">{currentUser.firstName?.[0]}{currentUser.lastName?.[0]}</span><h3>{currentUser.firstName} {currentUser.lastName}</h3><p>{roles[currentUser.role]}</p></div><div className="section-heading"><h3>Сегодня</h3><span className="date-label">{now.toLocaleDateString('ru-RU', {day:'numeric', month:'short'})}</span></div>{mine.length ? mine.slice(0,3).map((b,i) => <Link className={`agenda-item agenda-${i % 4}`} to="/bookings?mine=1" key={b.id}><small>{time(b.startTime)} — {time(b.endTime)}</small><strong>{b.purpose || 'Занятие'}</strong><span>Ауд. {rooms.find(r => r.id === b.roomId)?.roomNumber || b.roomId}</span></Link>) : <div className="agenda-empty"><Icon name="calendar" size={26}/><p>Впереди свободный день</p><small>Ваши ближайшие занятия появятся здесь.</small></div>}<Link className="text-link" to="/bookings?mine=1">Мои бронирования <Icon name="arrow" size={15}/></Link></section>
   <section className="occupancy-panel"><div className="section-heading"><h3>Кампус сейчас</h3><Icon name="grid" size={17}/></div><div className="occupancy-content"><div className="occupancy-ring" style={{ '--progress': `${error ? 0 : occupancy}%` } as CSSProperties}><strong>{error ? '—' : `${occupancy}%`}</strong></div><div><strong>Загруженность</strong><p>{error ? 'Нет данных' : `${busy} из ${rooms.filter(r => r.isActive).length} активных аудиторий заняты`}</p></div></div></section>
   <section className="tip-card"><span className="eyebrow">ПЛАНИРУЙТЕ ЗАРАНЕЕ</span><h3>Большие идеи<br/>начинаются с места.</h3><p>Выберите аудиторию, а мы поможем найти время.</p><Link to="/rooms" className="btn btn-light">Найти аудиторию <Icon name="arrow" size={16}/></Link><span className="tip-orbit"/></section>
  </aside>}
  </div></>}
  {selected && selectedState && <Dialog title={`Аудитория ${selected.roomNumber}`} onClose={() => setSelected(null)}><div className="detail-hero"><span className="room-symbol tone-1"><Icon name="room" size={28}/></span><div><h3>{selected.name}</h3><p>{roomTypes[selected.type]} · {selected.capacity} мест</p></div><button className={`icon-button favorite ${favorites.includes(selected.id) ? 'selected' : ''}`} aria-label="Избранное" aria-pressed={favorites.includes(selected.id)} onClick={() => toggleFavorite(selected.id)}><Icon name="star"/></button></div><p className="room-description">{selected.description || 'Описание аудитории пока не добавлено.'}</p><span className={`status-pill ${error ? 'offline' : selectedState.key}`}><i/>{error ? 'Статус неизвестен' : `${selectedState.label} сейчас`}</span><h3 className="detail-schedule-title">Занятия на {new Date(`${day}T12:00`).toLocaleDateString('ru-RU')}</h3>{dayBookings(bookings, day).filter(b => b.roomId === selected.id).map(b => <div className="detail-booking" key={b.id}><Icon name="clock" size={17}/><strong>{time(b.startTime)} — {time(b.endTime)}</strong><span>{b.purpose || 'Занятие'}</span></div>)}{!dayBookings(bookings, day).some(b => b.roomId === selected.id) && <p className="muted">{error ? 'Не удалось проверить расписание.' : 'На этот день занятий нет.'}</p>}<div className="button-row">{canBook && selected.isActive && <Link className="btn btn-primary" to={`/create-booking?roomId=${selected.id}`}><Icon name="plus" size={17}/>Забронировать</Link>}<button className="btn btn-secondary" onClick={() => setSelected(null)}>Закрыть</button></div></Dialog>}
 </>
}

