import { useEffect, useState, type FormEvent } from 'react'
import { api, apiErrorMessage } from '../services/api'
import { roles } from '../utils/booking'
import { showToast } from '../utils/toast'
import type { ProfileUpdateInput, User } from '../types'
import Icon from './Icon'

interface ProfileProps {
  user: User
  onUpdated: (user: User) => void
}

function Profile({ user, onUpdated }: ProfileProps) {
  const [form, setForm] = useState<ProfileUpdateInput>({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
  })
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setForm({ firstName: user.firstName, lastName: user.lastName, email: user.email })
  }, [user.firstName, user.lastName, user.email])

  const startEditing = () => {
    setForm({ firstName: user.firstName, lastName: user.lastName, email: user.email })
    setEditing(true)
  }

  const cancelEditing = () => {
    setForm({ firstName: user.firstName, lastName: user.lastName, email: user.email })
    setEditing(false)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)

    try {
      const response = await api.updateMyProfile({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
      })
      onUpdated(response.data)
      setEditing(false)
      showToast('Данные профиля сохранены.', 'success')
    } catch (err) {
      showToast(apiErrorMessage(err, 'Не удалось сохранить профиль.'), 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="profile-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">ВАШ АККАУНТ</span>
          <h1>Личный кабинет</h1>
          <p>Управляйте личными данными и быстро переходите к своим занятиям.</p>
        </div>
      </div>

      <section className="card profile-card profile-edit-card" aria-labelledby="profile-name">
        <div className="profile-summary">
          <span className="avatar large" aria-hidden="true">{user.firstName?.[0]}{user.lastName?.[0]}</span>
          <h2 id="profile-name">{user.firstName} {user.lastName}</h2>
          <p>{roles[user.role]}</p>
          <span className={`profile-status ${user.active === false ? 'is-inactive' : ''}`}>
            <span aria-hidden="true" />{user.active === false ? 'Аккаунт приостановлен' : 'Аккаунт активен'}
          </span>
        </div>

        <div className="profile-details">
          {editing ? (
            <form className="profile-form" onSubmit={handleSubmit}>
              <div className="profile-form-heading">
                <div><span className="eyebrow">ЛИЧНЫЕ ДАННЫЕ</span><h3>Редактирование профиля</h3></div>
                <p>Логин и роль используются для входа и управляются отдельно.</p>
              </div>
              <div className="profile-input-grid">
                <label className="form-group" htmlFor="profile-first-name">Имя
                  <input id="profile-first-name" autoComplete="given-name" required maxLength={100} value={form.firstName} onChange={event => setForm({ ...form, firstName: event.target.value })}/>
                </label>
                <label className="form-group" htmlFor="profile-last-name">Фамилия
                  <input id="profile-last-name" autoComplete="family-name" required maxLength={100} value={form.lastName} onChange={event => setForm({ ...form, lastName: event.target.value })}/>
                </label>
                <label className="form-group profile-email-field" htmlFor="profile-email">Электронная почта
                  <input id="profile-email" type="email" autoComplete="email" required maxLength={254} value={form.email} onChange={event => setForm({ ...form, email: event.target.value })}/>
                </label>
              </div>
              <div className="profile-readonly-grid">
                <div><span>Имя пользователя</span><strong>@{user.username}</strong></div>
                <div><span>Роль в системе</span><strong>{roles[user.role]}</strong></div>
              </div>
              <div className="profile-form-actions">
                <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Сохраняем…' : 'Сохранить изменения'}</button>
                <button className="btn btn-secondary" type="button" onClick={cancelEditing} disabled={saving}>Отмена</button>
              </div>
            </form>
          ) : (
            <>
              <div className="profile-details-heading">
                <div><span className="eyebrow">ЛИЧНЫЕ ДАННЫЕ</span><h3>Информация профиля</h3></div>
                <button className="icon-button" type="button" aria-label="Редактировать профиль" onClick={startEditing}><Icon name="settings"/></button>
              </div>
              <dl className="profile-info-grid">
                <div><dt>Имя</dt><dd>{user.firstName}</dd></div>
                <div><dt>Фамилия</dt><dd>{user.lastName}</dd></div>
                <div><dt>Имя пользователя</dt><dd>@{user.username}</dd></div>
                <div><dt>Электронная почта</dt><dd className="profile-email-value">{user.email}</dd></div>
                <div><dt>Роль</dt><dd>{roles[user.role]}</dd></div>
                <div><dt>Статус</dt><dd>{user.active === false ? 'Приостановлен' : 'Активен'}</dd></div>
              </dl>
            </>
          )}
        </div>
      </section>
    </div>
  )
}

export default Profile
