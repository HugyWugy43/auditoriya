// All wall-clock timestamps in the existing API are campus time (Europe/Moscow).
export const campusDate = value => value instanceof Date ? value : new Date(typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(value) ? `${value}+03:00` : value)
export const roomTypes = { LECTURE_HALL: 'Лекционная', LABORATORY: 'Лаборатория', SEMINAR_ROOM: 'Семинарская', STUDY_ROOM: 'Учебная комната', COMPUTER_LAB: 'Компьютерный класс' }
export const roles = { ADMIN: 'Администратор', TEACHER: 'Преподаватель', STUDENT: 'Студент' }
export const statusNames = { CONFIRMED: 'Подтверждено', PENDING: 'Ожидает', COMPLETED: 'Завершено', CANCELLED: 'Отменено', NEEDS_REVIEW: 'Нужна проверка' }
export const isActiveBooking = b => ['CONFIRMED', 'PENDING'].includes(b.status)
export const overlaps = (b, start, end) => isActiveBooking(b) && campusDate(b.startTime) < campusDate(end) && campusDate(b.endTime) > campusDate(start)
export const localDate = (date = new Date()) => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Moscow', year: 'numeric', month:'2-digit', day:'2-digit' }).format(date)
export const time = value => campusDate(value).toLocaleTimeString('ru-RU', { timeZone: 'Europe/Moscow', hour: '2-digit', minute: '2-digit' })
export const effectiveStatus = (b, now = new Date()) => isActiveBooking(b) && campusDate(b.endTime) <= now ? 'COMPLETED' : b.status
export function roomState(room, bookings, now = new Date()) {
 if (!room.isActive) return { key: 'offline', label: 'Недоступна', current: null, next: null }
 const list = bookings.filter(b => String(b.roomId) === String(room.id) && isActiveBooking(b) && campusDate(b.endTime) > now).sort((a, b) => campusDate(a.startTime) - campusDate(b.startTime))
 const current = list.find(b => campusDate(b.startTime) <= now)
 return { key: current ? 'busy' : 'free', label: current ? 'Занята' : 'Свободна', current, next: list.find(b => campusDate(b.startTime) > now) }
}
export function dayBookings(bookings, day) {
 const start = campusDate(`${day}T00:00:00`)
 const end = new Date(start.getTime() + 86400000)
 return bookings.filter(b => !['CANCELLED','NEEDS_REVIEW'].includes(b.status) && campusDate(b.startTime) < end && campusDate(b.endTime) > start).sort((a, b) => campusDate(a.startTime) - campusDate(b.startTime))
}
