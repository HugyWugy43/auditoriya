import React, { useState, useEffect } from 'react'
import { api } from '../services/api'

function Users() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [editingRole, setEditingRole] = useState(null)
  const [editingUser, setEditingUser] = useState(null)
  const [newRole, setNewRole] = useState('')
  const [editFormData, setEditFormData] = useState({
    firstName: '',
    lastName: '',
    email: ''
  })

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const response = await api.getUsers()
      setUsers(response.data)
      setError(null)
    } catch (err) {
      setError('Ошибка загрузки пользователей')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = async (userId, newRoleValue) => {
    try {
      const user = users.find(u => u.id === userId)
      if (!user) return

      const updatedUser = { ...user, role: newRoleValue }
      await api.updateUser(userId, updatedUser)
      setSuccess(`Роль пользователя ${user.username} успешно изменена на ${newRoleValue}`)
      setEditingRole(null)
      setNewRole('')
      loadUsers()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError('Ошибка изменения роли: ' + (err.response?.data?.message || err.message))
      console.error(err)
    }
  }

  const startEditUser = (user) => {
    setEditingUser(user.id)
    setEditFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email
    })
  }

  const cancelEditUser = () => {
    setEditingUser(null)
    setEditFormData({
      firstName: '',
      lastName: '',
      email: ''
    })
  }

  const handleUserUpdate = async (userId) => {
    try {
      const user = users.find(u => u.id === userId)
      if (!user) return

      const updatedUser = {
        ...user,
        firstName: editFormData.firstName,
        lastName: editFormData.lastName,
        email: editFormData.email
      }
      await api.updateUser(userId, updatedUser)
      setSuccess(`Данные пользователя ${user.username} успешно обновлены`)
      setEditingUser(null)
      setEditFormData({
        firstName: '',
        lastName: '',
        email: ''
      })
      loadUsers()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError('Ошибка обновления данных: ' + (err.response?.data?.message || err.message))
      console.error(err)
    }
  }

  const startEditRole = (user) => {
    setEditingRole(user.id)
    setNewRole(user.role)
  }

  const cancelEditRole = () => {
    setEditingRole(null)
    setNewRole('')
  }

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'ADMIN':
        return 'badge-danger'
      case 'TEACHER':
        return 'badge-warning'
      case 'STUDENT':
        return 'badge-success'
      default:
        return 'badge-success'
    }
  }

  if (loading) return <div className="card">Загрузка...</div>
  if (error) return <div className="error">{error}</div>

  return (
    <div>
      <div className="card">
        <h2>Список пользователей</h2>
        {success && <div className="success">{success}</div>}
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Имя пользователя</th>
              <th>Email</th>
              <th>Имя</th>
              <th>Фамилия</th>
              <th>Роль</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.username}{!user.active && <small className="cell-subtitle">Архивный аккаунт</small>}</td>
                <td>
                  {editingUser === user.id ? (
                    <input
                      type="email"
                      value={editFormData.email}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                      style={{ padding: '4px 8px', borderRadius: '4px', width: '100%' }}
                    />
                  ) : (
                    user.email
                  )}
                </td>
                <td>
                  {editingUser === user.id ? (
                    <input
                      type="text"
                      value={editFormData.firstName}
                      onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
                      style={{ padding: '4px 8px', borderRadius: '4px', width: '100%' }}
                    />
                  ) : (
                    user.firstName
                  )}
                </td>
                <td>
                  {editingUser === user.id ? (
                    <input
                      type="text"
                      value={editFormData.lastName}
                      onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
                      style={{ padding: '4px 8px', borderRadius: '4px', width: '100%' }}
                    />
                  ) : (
                    user.lastName
                  )}
                </td>
                <td>
                  {editingRole === user.id ? (
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value)}
                      style={{ padding: '4px 8px', borderRadius: '4px' }}
                    >
                      <option value="STUDENT">STUDENT</option>
                      <option value="TEACHER">TEACHER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  ) : (
                    <span className={`badge ${getRoleBadgeClass(user.role)}`}>
                      {user.role}
                    </span>
                  )}
                </td>
                <td>
                  {editingUser === user.id ? (
                    <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          className="btn btn-success"
                          onClick={() => handleUserUpdate(user.id)}
                          style={{ padding: '4px 12px', fontSize: '12px' }}
                        >
                          Сохранить
                        </button>
                        <button
                          className="btn btn-secondary"
                          onClick={cancelEditUser}
                          style={{ padding: '4px 12px', fontSize: '12px' }}
                        >
                          Отмена
                        </button>
                      </div>
                    </div>
                  ) : editingRole === user.id ? (
                    <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          className="btn btn-success"
                          onClick={() => handleRoleChange(user.id, newRole)}
                          style={{ padding: '4px 12px', fontSize: '12px' }}
                        >
                          Сохранить
                        </button>
                        <button
                          className="btn btn-secondary"
                          onClick={cancelEditRole}
                          style={{ padding: '4px 12px', fontSize: '12px' }}
                        >
                          Отмена
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                      <button
                        className="btn btn-primary"
                        onClick={() => startEditUser(user)}
                        style={{ padding: '4px 12px', fontSize: '12px' }}
                      >
                        Редактировать
                      </button>
                      <button
                        className="btn btn-warning"
                        onClick={() => startEditRole(user)}
                        style={{ padding: '4px 12px', fontSize: '12px' }}
                      >
                        Изменить роль
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Users

