import type { Booking, BookingStatus, Room, RoomState, RoomType, UserRole } from '../types'

// All wall-clock timestamps in the existing API are campus time (Europe/Moscow).
export const campusDate = (value: string | Date): Date => value instanceof Date ? value : new Date(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(value) ? `${value}+03:00` : value)
export const roomTypes: Record<RoomType, string> = { LECTURE_HALL: 'Лекционная', LABORATORY: 'Лаборатория', SEMINAR_ROOM: 'Семинарская', STUDY_ROOM: 'Учебная комната', COMPUTER_LAB: 'Компьютерный класс' }
export const roles: Record<UserRole, string> = { ADMIN: 'Администратор', TEACHER: 'Преподаватель', STUDENT: 'Студент' }
export const statusNames: Record<BookingStatus, string> = { CONFIRMED: 'Подтверждено', PENDING: 'Ожидает', COMPLETED: 'Завершено', CANCELLED: 'Отменено', NEEDS_REVIEW: 'Нужна проверка' }
export const isActiveBooking = (booking: Booking): boolean => ['CONFIRMED', 'PENDING'].includes(booking.status)
export const overlaps = (booking: Booking, start: string, end: string): boolean => isActiveBooking(booking) && campusDate(booking.startTime) < campusDate(end) && campusDate(booking.endTime) > campusDate(start)
export const localDate = (date = new Date()): string => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Moscow', year: 'numeric', month:'2-digit', day:'2-digit' }).format(date)
export const time = (value: string | Date): string => campusDate(value).toLocaleTimeString('ru-RU', { timeZone: 'Europe/Moscow', hour: '2-digit', minute: '2-digit' })
export const effectiveStatus = (booking: Booking, now = new Date()): BookingStatus => isActiveBooking(booking) && campusDate(booking.endTime) <= now ? 'COMPLETED' : booking.status
export function roomState(room: Pick<Room, 'id' | 'isActive'>, bookings: Booking[], now = new Date()): RoomState {
 if (!room.isActive) return { key: 'offline', label: 'Недоступна', current: null, next: null }
 const list = bookings.filter(b => String(b.roomId) === String(room.id) && isActiveBooking(b) && campusDate(b.endTime) > now).sort((a, b) => campusDate(a.startTime).getTime() - campusDate(b.startTime).getTime())
 const current = list.find(b => campusDate(b.startTime) <= now)
 return { key: current ? 'busy' : 'free', label: current ? 'Занята' : 'Свободна', current: current || null, next: list.find(b => campusDate(b.startTime) > now) || null }
}
export function dayBookings(bookings: Booking[], day: string): Booking[] {
 const start = campusDate(`${day}T00:00:00`)
 const end = new Date(start.getTime() + 86400000)
 return bookings.filter(b => !['CANCELLED','NEEDS_REVIEW'].includes(b.status) && campusDate(b.startTime) < end && campusDate(b.endTime) > start).sort((a, b) => campusDate(a.startTime).getTime() - campusDate(b.startTime).getTime())
}
