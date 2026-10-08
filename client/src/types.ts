export type UserRole = 'ADMIN' | 'TEACHER' | 'STUDENT'

export type RoomType =
  | 'LECTURE_HALL'
  | 'LABORATORY'
  | 'SEMINAR_ROOM'
  | 'STUDY_ROOM'
  | 'COMPUTER_LAB'

export type BookingStatus =
  | 'CONFIRMED'
  | 'PENDING'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NEEDS_REVIEW'

export interface User {
  id: number
  username: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  active?: boolean
  token?: string
}

export type ProfileUpdateInput = Pick<User, 'firstName' | 'lastName' | 'email'>

export interface AuthResponse extends User {
  token: string
  type?: string
}

export interface Room {
  id: number
  roomNumber: string
  name: string
  type: RoomType
  capacity: number
  description?: string | null
  isActive: boolean
  archived?: boolean
}

export type RoomInput = Omit<Room, 'id' | 'archived'>

export interface Booking {
  id: number
  userId: number | null
  roomId: number
  startTime: string
  endTime: string
  purpose?: string | null
  status: BookingStatus
  version?: number
}

export interface BookingInput {
  userId: number
  roomId: number
  startTime: string
  endTime: string
  purpose: string
}

export interface RegisterInput {
  username: string
  email: string
  password: string
  firstName: string
  lastName: string
}

export interface Notification {
  id: number
  roomId: number
  bookingId?: number | null
  message: string
  isRead: boolean
  createdAt: string
}

export interface NotificationPage {
  content: Notification[]
  unread: number
  totalPages: number
  totalElements: number
  number: number
}

export interface Page<T> {
  content: T[]
  totalPages: number
  totalElements: number
  last: boolean
}

export interface BookingQuery {
  page?: number
  size?: number
  roomId?: number
  userId?: number
  status?: BookingStatus
  q?: string
  from?: string
  to?: string
}

export interface RoomState {
  key: 'free' | 'busy' | 'offline'
  label: string
  current: Booking | null
  next: Booking | null
}
