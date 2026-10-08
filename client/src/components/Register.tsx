import { useState, useMemo, type ChangeEvent, type FormEvent } from 'react'
import { api, apiErrorMessage } from '../services/api'
import './Register.css'
import type { AuthResponse } from '../types'

interface RegisterProps {
  onRegister: (user: AuthResponse) => void
  onBackToLogin: () => void
}

interface RegisterForm {
  username: string
  email: string
  password: string
  confirmPassword: string
  firstName: string
  lastName: string
}

interface PasswordChecks {
  length: boolean
  lowercase: boolean
  uppercase: boolean
  numbers: boolean
  special: boolean
}

interface PasswordStrength {
  strength: number
  label: string
  color: string
  checks: PasswordChecks
}

function Register({ onRegister, onBackToLogin }: RegisterProps) {
  const [formData, setFormData] = useState<RegisterForm>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: ''
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Проверка надежности пароля
  const passwordStrength = useMemo<PasswordStrength>(() => {
    const password = formData.password
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      numbers: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    }
    if (!password) return { strength: 0, label: '', color: '', checks }

    const strength = Object.values(checks).filter(Boolean).length

    if (strength <= 2) {
      return { strength, label: 'Слабый', color: '#f5c2d1', checks }
    } else if (strength <= 4) {
      return { strength, label: 'Средний', color: '#fff9c4', checks }
    } else {
      return { strength, label: 'Сильный', color: '#c8e6c9', checks }
    }
  }, [formData.password])

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError(null)
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    // Валидация
    if (formData.password !== formData.confirmPassword) {
      setError('Пароли не совпадают')
      return
    }

    if (formData.password.length < 8) {
      setError('Пароль должен содержать минимум 8 символов')
      return
    }

    if (passwordStrength.strength < 3) {
      setError('Пароль слишком слабый. Используйте буквы, цифры и специальные символы')
      return
    }

    if (formData.username.length < 3) {
      setError('Имя пользователя должно содержать минимум 3 символа')
      return
    }

    setLoading(true)

    try {
      const { confirmPassword, ...registerData } = formData
      const response = await api.register(registerData)
      onRegister(response.data)
    } catch (err) {
      setError(apiErrorMessage(err, 'Ошибка регистрации'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="register-container">
      <div className="register-card animate-fade-in">
        <div className="register-header">
          <h2>Регистрация</h2>
          <p className="register-subtitle">Создайте новый аккаунт</p>
        </div>
        
        {error && <div className="error-message animate-shake">{error}</div>}
        
        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">Имя</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                placeholder="Введите имя"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="lastName">Фамилия</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                placeholder="Введите фамилию"
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="username">Имя пользователя</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              minLength={3}
              placeholder="Введите имя пользователя"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Введите email"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Пароль</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={8}
                placeholder="Минимум 8 символов"
                className={formData.password ? (passwordStrength.strength >= 3 ? 'valid' : 'invalid') : ''}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            
            {formData.password && (
              <div className="password-strength-indicator">
                <div className="strength-bar">
                  <div 
                    className="strength-fill" 
                    style={{ 
                      width: `${(passwordStrength.strength / 5) * 100}%`,
                      backgroundColor: passwordStrength.color
                    }}
                  />
                </div>
                <span className="strength-label">
                  {passwordStrength.label}
                </span>
              </div>
            )}
            
            {formData.password && (
              <div className="password-requirements">
                <div className={`requirement ${formData.password.length >= 8 ? 'met' : ''}`}>
                  <span className="requirement-icon">
                    {formData.password.length >= 8 ? '✓' : '○'}
                  </span>
                  <span>Минимум 8 символов</span>
                </div>
                <div className={`requirement ${passwordStrength.checks.lowercase ? 'met' : ''}`}>
                  <span className="requirement-icon">
                    {passwordStrength.checks.lowercase ? '✓' : '○'}
                  </span>
                  <span>Строчные буквы (a-z)</span>
                </div>
                <div className={`requirement ${passwordStrength.checks.uppercase ? 'met' : ''}`}>
                  <span className="requirement-icon">
                    {passwordStrength.checks.uppercase ? '✓' : '○'}
                  </span>
                  <span>Заглавные буквы (A-Z)</span>
                </div>
                <div className={`requirement ${passwordStrength.checks.numbers ? 'met' : ''}`}>
                  <span className="requirement-icon">
                    {passwordStrength.checks.numbers ? '✓' : '○'}
                  </span>
                  <span>Цифры (0-9)</span>
                </div>
                <div className={`requirement ${passwordStrength.checks.special ? 'met' : ''}`}>
                  <span className="requirement-icon">
                    {passwordStrength.checks.special ? '✓' : '○'}
                  </span>
                  <span>Специальные символы (!@#$...)</span>
                </div>
              </div>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword">Подтвердите пароль</label>
            <input
              type={showPassword ? "text" : "password"}
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              placeholder="Повторите пароль"
              className={formData.confirmPassword ? (formData.password === formData.confirmPassword ? 'valid' : 'invalid') : ''}
            />
            {formData.confirmPassword && formData.password === formData.confirmPassword && (
              <div className="password-match">✓ Пароли совпадают</div>
            )}
            {formData.confirmPassword && formData.password !== formData.confirmPassword && (
              <div className="password-mismatch">✗ Пароли не совпадают</div>
            )}
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary btn-block register-button"
            disabled={loading || passwordStrength.strength < 3}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Регистрация...
              </>
            ) : (
              'Зарегистрироваться'
            )}
          </button>
        </form>
        
        <div className="register-footer">
          <p>Уже есть аккаунт? <button className="link-button" onClick={onBackToLogin}>Войти</button></p>
        </div>
      </div>
    </div>
  )
}

export default Register

