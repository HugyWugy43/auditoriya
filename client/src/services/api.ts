import axios, { type AxiosResponse } from 'axios'
import type {
  AuthResponse,
  Booking,
  BookingInput,
  BookingQuery,
  NotificationPage,
  Page,
  ProfileUpdateInput,
  RegisterInput,
  Room,
  RoomInput,
  User,
} from '../types'

const API_BASE = '/api'
axios.defaults.timeout = 15000

axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

axios.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (
      axios.isAxiosError(error)
      && error.response?.status === 401
      && !error.config?.url?.endsWith('/auth/login')
    ) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

export const api = {
  login: (username: string, password: string): Promise<AxiosResponse<AuthResponse>> =>
    axios.post(`${API_BASE}/auth/login`, { username, password }),
  register: (registerData: RegisterInput): Promise<AxiosResponse<AuthResponse>> =>
    axios.post(`${API_BASE}/auth/register`, registerData),
  validateToken: (): Promise<AxiosResponse<User>> =>
    axios.post(`${API_BASE}/auth/validate`, null, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    }),

  getUsers: (): Promise<AxiosResponse<User[]>> => axios.get(`${API_BASE}/users`),
  getUser: (id: number): Promise<AxiosResponse<User>> => axios.get(`${API_BASE}/users/${id}`),
  updateMyProfile: (profile: ProfileUpdateInput): Promise<AxiosResponse<User>> => axios.put(`${API_BASE}/users/me`, profile),
  createUser: (user: Partial<User>): Promise<AxiosResponse<User>> => axios.post(`${API_BASE}/users`, user),
  updateUser: (id: number, user: Partial<User>): Promise<AxiosResponse<User>> => axios.put(`${API_BASE}/users/${id}`, user),
  deleteUser: (id: number): Promise<AxiosResponse<void>> => axios.delete(`${API_BASE}/users/${id}`),

  getRooms: (): Promise<AxiosResponse<Room[]>> => axios.get(`${API_BASE}/rooms`),
  getRoom: (id: number): Promise<AxiosResponse<Room>> => axios.get(`${API_BASE}/rooms/${id}`),
  createRoom: (room: RoomInput): Promise<AxiosResponse<Room>> => axios.post(`${API_BASE}/rooms`, room),
  updateRoom: (id: number, room: RoomInput): Promise<AxiosResponse<Room>> => axios.put(`${API_BASE}/rooms/${id}`, room),
  deleteRoom: (id: number): Promise<AxiosResponse<void>> => axios.delete(`${API_BASE}/rooms/${id}`),

  getBookingsPage: (params: BookingQuery = {}): Promise<AxiosResponse<Page<Booking>>> =>
    axios.get(`${API_BASE}/bookings`, { params }),
  getBookings: async (params: Omit<BookingQuery, 'page' | 'size'> = {}): Promise<{ data: Booking[] }> => {
    const data: Booking[] = []
    for (let page = 0; page < 100; page += 1) {
      const response = await axios.get<Page<Booking>>(`${API_BASE}/bookings`, {
        params: { ...params, page, size: 100 },
      })
      data.push(...response.data.content)
      if (response.data.last) return { data }
    }
    throw new Error('Слишком большой интервал. Выберите меньший диапазон.')
  },
  getSubscriptions: (): Promise<AxiosResponse<number[]>> => axios.get(`${API_BASE}/subscriptions/rooms`),
  subscribe: (id: number): Promise<AxiosResponse<void>> => axios.put(`${API_BASE}/subscriptions/rooms/${id}`),
  unsubscribe: (id: number): Promise<AxiosResponse<void>> => axios.delete(`${API_BASE}/subscriptions/rooms/${id}`),
  getNotifications: (page = 0): Promise<AxiosResponse<NotificationPage>> =>
    axios.get(`${API_BASE}/notifications`, { params: { page, size: 20 } }),
  readNotification: (id: number): Promise<AxiosResponse<void>> => axios.post(`${API_BASE}/notifications/${id}/read`),
  getBooking: (id: number): Promise<AxiosResponse<Booking>> => axios.get(`${API_BASE}/bookings/${id}`),
  getBookingsByUser: (userId: number): Promise<AxiosResponse<Page<Booking>>> =>
    axios.get(`${API_BASE}/bookings`, { params: { userId } }),
  getBookingsByRoom: (roomId: number): Promise<AxiosResponse<Page<Booking>>> =>
    axios.get(`${API_BASE}/bookings`, { params: { roomId } }),
  createBooking: (booking: BookingInput): Promise<AxiosResponse<Booking>> => axios.post(`${API_BASE}/bookings`, booking),
  updateBooking: (id: number, booking: Partial<BookingInput>): Promise<AxiosResponse<Booking>> =>
    axios.put(`${API_BASE}/bookings/${id}`, booking),
  reviewBooking: (id: number, times: Pick<BookingInput, 'startTime' | 'endTime'>): Promise<AxiosResponse<Booking>> =>
    axios.post(`${API_BASE}/bookings/${id}/review`, times),
  cancelBooking: (id: number, userId: number): Promise<AxiosResponse<void>> =>
    axios.post(`${API_BASE}/bookings/${id}/cancel`, null, { params: { userId } }),
  deleteBooking: (id: number): Promise<AxiosResponse<void>> => axios.delete(`${API_BASE}/bookings/${id}`),
}

export function apiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message || error.message || fallback
  }
  return error instanceof Error && error.message ? error.message : fallback
}

export function isUnauthorizedError(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 401
}
