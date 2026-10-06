import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../services/api'
import useCampus from '../hooks/useCampus'
import { campusDate, overlaps, roomTypes, time, localDate } from '../utils/booking.mjs'
import Icon from './Icon'
export default function CreateBooking({ currentUser }) {
 const [params] = useSearchParams(), navigate = useNavigate()
 const [users, setUsers] = useState([]), [usersError, setUsersError] = useState('')
 const [form, setForm] = useState({ userId: String(currentUser.id), roomId: params.get('roomId') || '', startTime: '', endTime: '', purpose: '' })
 const { rooms, bookings, loading, error: loadError, refresh } = useCampus(form.startTime.slice(0,10) || localDate(), form.endTime.slice(0,10) || form.startTime.slice(0,10) || localDate())
 const [error, setError] = useState(''), [pending, setPending] = useState(false)
 useEffect(() => { if (currentUser.role === 'ADMIN') api.getUsers().then(r => setUsers(r.data)).catch(() => setUsersError('Список пользователей недоступен. Бронирование возможно от своего имени.')) }, [currentUser.role])
 const room = rooms.find(r => String(r.id) === form.roomId)
 const validInterval = form.startTime && form.endTime && campusDate(form.endTime) > campusDate(form.startTime)
 const conflicts = validInterval ? bookings.filter(b => String(b.roomId) === form.roomId && overlaps(b, form.startTime, form.endTime)) : []
 const change = e => { setForm({ ...form, [e.target.name]: e.target.value }); setError('') }
 const submit = async e => {
  e.preventDefault(); setError('')
  if (!validInterval) { setError('Время окончания должно быть позже времени начала.'); return }
  if (campusDate(form.startTime) <= new Date()) { setError('Выберите время начала в будущем.'); return }
  if (!room?.isActive || conflicts.length) { setError('Аудитория недоступна в выбранное время.'); return }
  setPending(true)
  try { await api.createBooking({ ...form, userId: Number(form.userId), roomId: Number(form.roomId), startTime: `${form.startTime}:00`, endTime: `${form.endTime}:00` }); navigate(Number(form.userId) === currentUser.id ? '/bookings?mine=1' : '/bookings') }
  catch (err) { setError(err.response?.data?.message || 'Не удалось создать бронирование. Попробуйте ещё раз.'); refresh() }
  finally { setPending(false) }
 }
 return <><div className="page-heading"><div><Link className="text-link" to="/rooms"><Icon name="back" size={15}/>К аудиториям</Link><h1>Новое бронирование<span className="heading-dot">.</span></h1><p>Выберите пространство и время для вашего занятия.</p></div></div><div className="booking-layout"><section className="panel booking-form"><div className="section-heading"><h2>Детали занятия</h2><span className="step-label">01 / 01</span></div>{(error || loadError) && <div className="error" role="alert">{error || loadError}{loadError && <button className="text-button" onClick={refresh}>Повторить</button>}</div>}{usersError && <p className="muted">{usersError}</p>}
 <form onSubmit={submit}><div className="form-group"><label htmlFor="booking-user">Организатор</label>{currentUser.role === 'ADMIN' && users.length ? <select id="booking-user" name="userId" value={form.userId} onChange={change} required>{users.filter(u => u.active && ['ADMIN','TEACHER'].includes(u.role)).map(u => <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>)}</select> : <input id="booking-user" value={`${currentUser.firstName} ${currentUser.lastName}`} disabled/>}</div>
 <div className="form-group"><label htmlFor="booking-room">Аудитория</label><select id="booking-room" name="roomId" value={form.roomId} onChange={change} required disabled={loading}><option value="">{loading ? 'Загружаем аудитории…' : 'Выберите аудиторию'}</option>{rooms.filter(r => r.isActive).map(r => <option key={r.id} value={r.id}>{r.roomNumber} · {r.name} · {r.capacity} мест</option>)}</select></div>
 <div className="form-row">{[['startTime','Начало занятия'], ['endTime','Окончание']].map(([name,label]) => <div className="form-group" key={name}><label htmlFor={name}>{label}</label><input id={name} type="datetime-local" name={name} value={form[name]} min={name === 'endTime' && form.startTime ? form.startTime : `${localDate()}T00:00`} onChange={change} required/></div>)}</div>
 <div className="form-group"><label htmlFor="booking-purpose">Цель бронирования</label><textarea id="booking-purpose" name="purpose" value={form.purpose} onChange={change} maxLength={1000} placeholder="Например, практическое занятие по программированию"/><small className="muted">{form.purpose.length} / 1000</small></div><div className="button-row"><button className="btn btn-primary" type="submit" disabled={pending || loading || !!loadError || !!conflicts.length}>{pending ? 'Создаём…' : 'Подтвердить бронирование'}<Icon name="arrow" size={17}/></button><Link className="btn btn-secondary" to="/rooms">Отмена</Link></div></form></section>
 <aside><section className="panel booking-summary"><span className="room-symbol tone-1"><Icon name="room" size={28}/></span><span className="eyebrow">ВАШ ВЫБОР</span><h2>{room ? `Аудитория ${room.roomNumber}` : 'Подходящее место'}</h2><p>{room ? room.name : 'Выберите аудиторию, чтобы увидеть её параметры.'}</p>{room && <><div className="summary-line"><span>Тип</span><strong>{roomTypes[room.type]}</strong></div><div className="summary-line"><span>Вместимость</span><strong>{room.capacity} мест</strong></div><p className="muted">{room.description}</p></>}{validInterval && room && !loadError && !loading && <div className={conflicts.length ? 'error' : 'success'}>{conflicts.length ? `Есть пересечение: ${conflicts.map(b => `${time(b.startTime)}–${time(b.endTime)}`).join(', ')}` : 'Выбранный интервал свободен. Доступность будет повторно проверена при сохранении.'}</div>}</section><p className="form-hint"><Icon name="clock" size={16}/>Время указывается по местному времени кампуса (Москва).</p></aside></div></>
}


