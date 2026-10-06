import axios from 'axios'

// Используем относительные пути через Vite proxy для избежания CORS проблем
const API_BASE = '/api'
axios.defaults.timeout = 15000

// Настройка axios для добавления токена в заголовки
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Обработка ошибок авторизации
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config?.url?.endsWith('/auth/login')) {
      // Токен истек или недействителен
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const api = {
  // Auth
  login: (username, password) => axios.post(`${API_BASE}/auth/login`, { username, password }),
  register: (registerData) => axios.post(`${API_BASE}/auth/register`, registerData),
  validateToken: () => axios.post(`${API_BASE}/auth/validate`, null, {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  }),

  // Users
  // Users
  getUsers: () => axios.get(`${API_BASE}/users`),
  getUser: (id) => axios.get(`${API_BASE}/users/${id}`),
  createUser: (user) => axios.post(`${API_BASE}/users`, user),
  updateUser: (id, user) => axios.put(`${API_BASE}/users/${id}`, user),
  deleteUser: (id) => axios.delete(`${API_BASE}/users/${id}`),

  // Rooms
  getRooms: () => axios.get(`${API_BASE}/rooms`),
  getRoom: (id) => axios.get(`${API_BASE}/rooms/${id}`),
  createRoom: (room) => axios.post(`${API_BASE}/rooms`, room),
  updateRoom: (id, room) => axios.put(`${API_BASE}/rooms/${id}`, room),
  deleteRoom: (id) => axios.delete(`${API_BASE}/rooms/${id}`),

  // Bookings
  getBookingsPage: (params = {}) => axios.get(API_BASE + '/bookings', { params }),
  getBookings: async (params = {}) => {
    const data = []
    for (let page = 0; page < 100; page++) {
      const response = await axios.get(API_BASE + '/bookings', { params: { ...params, page, size: 100 } })
      data.push(...response.data.content)
      if (response.data.last) return { data }
    }
    throw new Error('Слишком большой интервал. Выберите меньший диапазон.')
  },
  getSubscriptions: () => axios.get(API_BASE + '/subscriptions/rooms'),
  subscribe: id => axios.put(API_BASE + '/subscriptions/rooms/' + id),
  unsubscribe: id => axios.delete(API_BASE + '/subscriptions/rooms/' + id),
  getNotifications: (page = 0) => axios.get(API_BASE + '/notifications', { params: { page, size: 20 } }),
  readNotification: id => axios.post(API_BASE + '/notifications/' + id + '/read'),
  getBooking: (id) => axios.get(`${API_BASE}/bookings/${id}`),
  getBookingsByUser: (userId) => axios.get(`${API_BASE}/bookings`, { params: { userId } }),
  getBookingsByRoom: (roomId) => axios.get(`${API_BASE}/bookings`, { params: { roomId } }),
  createBooking: (booking) => axios.post(`${API_BASE}/bookings`, booking),
  updateBooking: (id, booking) => axios.put(`${API_BASE}/bookings/${id}`, booking),
  reviewBooking: (id,times) => axios.post(API_BASE + '/bookings/' + id + '/review', times),
  cancelBooking: (id, userId) => axios.post(`${API_BASE}/bookings/${id}/cancel`, null, {
    params: { userId }
  }),
  deleteBooking: (id) => axios.delete(`${API_BASE}/bookings/${id}`),
}


