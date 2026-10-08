import { useState, useEffect, useCallback, useRef, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api, apiErrorMessage } from '../services/api'
import { campusDate, effectiveStatus, statusNames, time } from '../utils/booking'
import Icon from './Icon'
import Dialog from './Dialog'
import type { Booking, BookingStatus, Room, User } from '../types'

interface BookingsProps { currentUser: User }

export default function Bookings({ currentUser }: BookingsProps) {
 const [params, setParams] = useSearchParams()
 const roomId = params.has('roomId') ? Number(params.get('roomId')) : undefined
 const mine = params.get('mine') === '1'
 const [status, setStatus] = useState<BookingStatus | ''>(''), [query, setQuery] = useState(''), [cancel, setCancel] = useState<Booking | null>(null), [pending, setPending] = useState(false), [actionError, setActionError] = useState('')
 const [rooms,setRooms] = useState<Room[]>([]), [bookings,setBookings] = useState<Booking[]>([]), [loading,setLoading] = useState(true), [error,setError] = useState(''), [page,setPage] = useState(0), [pages,setPages] = useState(0), [total,setTotal] = useState(0)
 const requestId = useRef(0)
 const refresh = useCallback(async () => {
  const id = ++requestId.current; setLoading(true)
  try { const [r,b] = await Promise.all([api.getRooms(),api.getBookingsPage({ page,size:25,roomId,status:status || undefined,q:query,userId:mine ? currentUser.id : undefined })]); if(id !== requestId.current) return; setRooms(r.data); setBookings(b.data.content); setPages(b.data.totalPages); setTotal(b.data.totalElements); setError('') }
  catch { if(id === requestId.current) setError('Не удалось загрузить историю. Повторите попытку.') }
  finally { if(id === requestId.current) setLoading(false) }
 },[page,status,query,mine,roomId,currentUser.id])
 useEffect(() => { const timer = setTimeout(refresh,250); return () => { requestId.current++; clearTimeout(timer) } },[refresh])
 const [review,setReview] = useState<Booking | null>(null), [reviewStart,setReviewStart] = useState(''), [reviewEnd,setReviewEnd] = useState('')
 const resolveReview = async (e: FormEvent<HTMLFormElement>) => { e.preventDefault(); if (!review) return; setPending(true); setActionError(''); try { await api.reviewBooking(review.id,{startTime:reviewStart+':00',endTime:reviewEnd+':00'}); setReview(null); await refresh() } catch(err) { setActionError(apiErrorMessage(err, 'Не удалось подтвердить интервал.')) } finally { setPending(false) } }
 const roomName = (id: number) => rooms.find(r => r.id === id)?.roomNumber || `#${id}`
 const visible = bookings
 const confirmCancel = async () => {
  if (!cancel) return
  setPending(true); setActionError('')
  try { await api.cancelBooking(cancel.id, currentUser.id); setCancel(null); await refresh() }
  catch (err) { setActionError(apiErrorMessage(err, 'Не удалось отменить бронирование. Попробуйте ещё раз.')) }
  finally { setPending(false) }
 }
 return <><div className="page-heading"><div><span className="eyebrow">ВАШИ ПЛАНЫ</span><h1>Бронирования<span className="heading-dot">.</span></h1><p>Предстоящие занятия и история использования аудиторий.</p></div>{currentUser.role !== 'STUDENT' && <Link className="btn btn-primary" to="/create-booking"><Icon name="plus"/>Новая бронь</Link>}</div>
 {roomId && <p className="filter-summary">Аудитория {roomName(Number(roomId))} · <Link to="/bookings">Все аудитории</Link></p>}<section className="panel"><div className="booking-toolbar"><div className="segmented"><button className={!mine ? 'active' : ''} onClick={() => { setPage(0); setParams({}) }}>Все бронирования</button><button className={mine ? 'active' : ''} onClick={() => { setPage(0); setParams({ mine:'1' }) }}>Только мои</button></div><div className="filter-row"><label className="search-field"><Icon name="search" size={17}/><input placeholder="Поиск по цели занятия…" aria-label="Поиск бронирования" value={query} onChange={e => { setPage(0); setQuery(e.target.value) }}/></label><select aria-label="Статус бронирования" value={status} onChange={e => { setPage(0); setStatus(e.target.value as BookingStatus | '') }}><option value="">Все статусы</option>{Object.entries(statusNames).map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select></div></div>
 {error && <div className="error" role="alert">{error}<button className="text-button" onClick={refresh}>Повторить</button></div>}
 {loading ? <div className="empty-state">Загружаем бронирования…</div> : <div className="table-scroll"><table className="table"><thead><tr><th>Аудитория / цель</th><th>Дата</th><th>Время</th><th>Организатор</th><th>Статус</th><th>Действие</th></tr></thead><tbody>{visible.map(b => { const state = effectiveStatus(b); return <tr key={b.id}><td><strong>Ауд. {roomName(b.roomId)}</strong><small className="cell-subtitle">{b.purpose || 'Занятие'}</small></td><td>{campusDate(b.startTime).toLocaleDateString('ru-RU', { timeZone: 'Europe/Moscow' })}</td><td>{time(b.startTime)} — {time(b.endTime)}{b.startTime.slice(0,10) !== b.endTime.slice(0,10) && <small className="cell-subtitle">до {campusDate(b.endTime).toLocaleDateString('ru-RU', { timeZone: 'Europe/Moscow' })}</small>}</td><td>{b.userId === currentUser.id ? 'Вы' : b.userId ? `Пользователь #${b.userId}` : 'Участник кампуса'}</td><td><span className={`status-pill ${state === 'CONFIRMED' ? 'free' : state === 'PENDING' ? 'busy' : 'offline'}`}>{statusNames[state]}</span></td><td>{state === 'NEEDS_REVIEW' && currentUser.role === 'ADMIN' && <button className="text-button" onClick={() => { setReview(b); setReviewStart(''); setReviewEnd(''); setActionError('') }}>Проверить</button>}{['PENDING','CONFIRMED','NEEDS_REVIEW'].includes(state) && (currentUser.role === 'ADMIN' || (currentUser.role === 'TEACHER' && b.userId === currentUser.id)) && <button className="text-button danger-text" onClick={() => { setCancel(b); setActionError('') }}>Отменить</button>}</td></tr> })}</tbody></table>{!visible.length && <div className="empty-state"><Icon name="calendar" size={32}/><h3>Пока нет бронирований</h3><p>Создайте первое занятие или измените фильтры.</p></div>}</div>}<div className="pagination"><span>Всего: {total} · Страница {page + 1} из {Math.max(1,pages)}</span><button className="btn btn-secondary" disabled={loading || !page} onClick={() => setPage(page-1)}>Назад</button><button className="btn btn-secondary" disabled={loading || page+1 >= pages} onClick={() => setPage(page+1)}>Далее</button></div></section>
 {review && <Dialog title="Проверить старое бронирование" onClose={() => { if(!pending) setReview(null) }}><p>У записи есть конфликт или некорректный интервал. Выберите свободное время для аудитории {roomName(review.roomId)}. Исходные данные сохранены в журнале переноса.</p><form onSubmit={resolveReview}><label className="form-group">Начало<input type="datetime-local" value={reviewStart} onChange={e => setReviewStart(e.target.value)} required/></label><label className="form-group">Окончание<input type="datetime-local" value={reviewEnd} onChange={e => setReviewEnd(e.target.value)} required/></label>{actionError && <div role="alert" className="error">{actionError}</div>}<button className="btn btn-primary" disabled={pending}>Подтвердить и перенести</button></form></Dialog>}
 {cancel && <Dialog title="Отменить бронирование?" onClose={() => { if (!pending) setCancel(null) }}><p>Аудитория {roomName(cancel.roomId)} освободится для других занятий.</p><div className="booking-details"><strong>{cancel.purpose || 'Занятие'}</strong><p>{campusDate(cancel.startTime).toLocaleDateString('ru-RU', { timeZone: 'Europe/Moscow' })} · {time(cancel.startTime)} — {time(cancel.endTime)}</p></div>{actionError && <div className="error" role="alert">{actionError}</div>}<div className="button-row"><button className="btn btn-danger" disabled={pending} onClick={confirmCancel}>{pending ? 'Отменяем…' : 'Да, отменить'}</button><button className="btn btn-secondary" disabled={pending} onClick={() => setCancel(null)}>Оставить бронь</button></div></Dialog>}</>
}

