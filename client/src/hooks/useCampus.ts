import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '../services/api'
import { localDate } from '../utils/booking'
import type { Booking, Room } from '../types'
export default function useCampus(day = localDate(), endDay = day) {
 const [data, setData] = useState<{ rooms: Room[]; bookings: Booking[] }>({ rooms: [], bookings: [] })
 const [loading, setLoading] = useState(true), [error, setError] = useState(''), [updated, setUpdated] = useState<Date | null>(null), [refreshing, setRefreshing] = useState(false)
 const request = useRef(0)
 const refresh = useCallback(async () => {
  const id = ++request.current; setRefreshing(true)
  const next = (d: string) => { const date = new Date(d + 'T12:00:00Z'); date.setUTCDate(date.getUTCDate() + 1); return date.toISOString().slice(0,10) }
  try {
   const windows = [...new Set([localDate(),day])]
   const [rooms, ...pages] = await Promise.all([api.getRooms(), ...windows.map(d => api.getBookings({from:d+'T00:00:00',to:next(d === day ? endDay : d)+'T00:00:00'}))])
   if (id === request.current) { setData({ rooms: rooms.data, bookings: [...new Map(pages.flatMap(p => p.data).map(b => [b.id,b])).values()] }); setUpdated(new Date()); setError('') }
  } catch { if (id === request.current) setError('Не удалось обновить данные. Доступность аудиторий пока не подтверждена.') }
  finally { if (id === request.current) { setLoading(false); setRefreshing(false) } }
 }, [day,endDay])
 useEffect(() => {
  setLoading(true); refresh()
  const timer = setInterval(() => { if (!document.hidden) refresh() },30000)
  window.addEventListener('focus',refresh)
  return () => { request.current++; clearInterval(timer); window.removeEventListener('focus',refresh) }
 }, [refresh])
 return { ...data, loading, error, updated, refreshing, refresh }
}
