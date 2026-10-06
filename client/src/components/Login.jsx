import React, { useState } from 'react'
import { api } from '../services/api'
import './Login.css'
import Icon from './Icon'

function Login({ onLogin, onShowRegister }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const response = await api.login(username, password)
      onLogin(response.data)
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Ошибка входа'
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <aside className="auth-visual"><span className="eyebrow">ЕДИНЫЙ КАМПУС</span><h1>Знаниям нужно пространство.</h1><p>Аудитории, лаборатории и ваше расписание. Всё в одном месте.</p><div className="auth-art" aria-hidden="true"><span/><span/><span/></div><small>Планируйте. Бронируйте. Создавайте.</small></aside><div className="login-card"><div className="auth-brand"><span className="brand-mark"><Icon name="room"/></span>аудитория.</div>
        <h2>Вход в систему</h2>
        <p className="login-subtitle">Система управления бронированием аудиторий</p>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Имя пользователя</label>
            <input
              type="text"
              id="username" autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
              placeholder="Введите имя пользователя"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Пароль</label>
            <input
              type="password"
              id="password" autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Введите пароль"
            />
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>
        
        <div className="login-footer">
          <p>Нет аккаунта?</p>
          <button 
            className="btn btn-secondary btn-block register-link-button" 
            onClick={onShowRegister}
          >
            Зарегистрироваться
          </button>
        </div>
      </div>
    </div>
  )
}

export default Login


