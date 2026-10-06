import React, { useState, useEffect } from 'react'
import { api } from '../services/api'
import Dialog from './Dialog'

function ManageRooms() {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingRoom, setEditingRoom] = useState(null)
  const [formData, setFormData] = useState({
    roomNumber: '',
    name: '',
    type: 'LECTURE_HALL',
    capacity: '',
    description: '',
    isActive: true
  })

  useEffect(() => {
    loadRooms()
  }, [])

  const loadRooms = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.getRooms()
      setRooms(response.data || [])
    } catch (err) {
      setError('Ошибка загрузки аудиторий')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    })
  }

  const handleCreate = () => {
    setFormData({
      roomNumber: '',
      name: '',
      type: 'LECTURE_HALL',
      capacity: '',
      description: '',
      isActive: true
    })
    setEditingRoom(null)
    setShowCreateModal(true)
  }

  const handleEdit = (room) => {
    setFormData({
      roomNumber: room.roomNumber,
      name: room.name,
      type: room.type,
      capacity: room.capacity.toString(),
      description: room.description || '',
      isActive: room.isActive
    })
    setEditingRoom(room)
    setShowCreateModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    try {
      const roomData = {
        ...formData,
        capacity: parseInt(formData.capacity)
      }

      if (editingRoom) {
        await api.updateRoom(editingRoom.id, roomData)
        setSuccess('Аудитория успешно обновлена!')
      } else {
        await api.createRoom(roomData)
        setSuccess('Аудитория успешно создана!')
      }

      setShowCreateModal(false)
      setEditingRoom(null)
      loadRooms()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError('Ошибка: ' + (err.response?.data?.message || err.message))
      console.error(err)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Перенести аудиторию в архив? История бронирований сохранится.')) {
      return
    }

    try {
      await api.deleteRoom(id)
      setSuccess('Аудитория перенесена в архив.')
      loadRooms()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError('Ошибка архивирования: ' + (err.response?.data?.message || err.message))
      console.error(err)
    }
  }

  const getTypeText = (type) => {
    const types = {
      LECTURE_HALL: 'Лекционная',
      LABORATORY: 'Лаборатория',
      SEMINAR_ROOM: 'Семинарская', STUDY_ROOM: 'Учебная комната',
      COMPUTER_LAB: 'Компьютерный класс'
    }
    return types[type] || type
  }

  if (loading) return <div className="card">Загрузка...</div>

  return (
    <div>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>Управление аудиториями</h2>
          <button className="btn btn-primary" onClick={handleCreate}>
            Создать аудиторию
          </button>
        </div>
        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}
        <table className="table">
          <thead>
            <tr>
              <th>Номер</th>
              <th>Название</th>
              <th>Тип</th>
              <th>Вместимость</th>
              <th>Статус</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {rooms.map(room => (
              <tr key={room.id}>
                <td>{room.roomNumber}</td>
                <td>{room.name}</td>
                <td>{getTypeText(room.type)}</td>
                <td>{room.capacity}</td>
                <td>
                  <span className={`badge ${room.isActive ? 'badge-success' : 'badge-danger'}`}>
                    {room.archived ? 'В архиве' : room.isActive ? 'Активна' : 'Неактивна'}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="btn btn-primary"
                      onClick={() => handleEdit(room)}
                      style={{ padding: '4px 12px', fontSize: '12px' }}
                    >
                      Редактировать
                    </button>
                    <button
                      className="btn btn-danger"
                      disabled={room.archived}
                      onClick={() => handleDelete(room.id)}
                      style={{ padding: '4px 12px', fontSize: '12px' }}
                    >В архив</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Модальное окно создания/редактирования */}
      {showCreateModal && (
        <Dialog title={editingRoom ? 'Редактировать аудиторию' : 'Создать аудиторию'} onClose={() => setShowCreateModal(false)}>
            {error && <div className="error" role="alert">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="manage-roomNumber">Номер аудитории</label>
                <input
                  type="text"
                  id="manage-roomNumber" name="roomNumber"
                  value={formData.roomNumber}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="manage-name">Название</label>
                <input
                  type="text"
                  id="manage-name" name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="manage-type">Тип</label>
                <select
                  id="manage-type" name="type"
                  value={formData.type}
                  onChange={handleChange}
                  required
                >
                  <option value="LECTURE_HALL">Лекционная</option>
                  <option value="LABORATORY">Лаборатория</option>
                  <option value="SEMINAR_ROOM">Семинарская</option>
                  <option value="COMPUTER_LAB">Компьютерный класс</option><option value="STUDY_ROOM">Учебная комната</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="manage-capacity">Вместимость</label>
                <input
                  type="number"
                  id="manage-capacity" name="capacity"
                  value={formData.capacity}
                  onChange={handleChange}
                  required
                  min="1"
                />
              </div>
              <div className="form-group">
                <label htmlFor="manage-description">Описание</label>
                <textarea
                  id="manage-description" name="description" maxLength={1000}
                  value={formData.description}
                  onChange={handleChange}
                  rows="3"
                />
              </div>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                  />
                  Активна
                </label>
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn btn-primary">
                  {editingRoom ? 'Сохранить' : 'Создать'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowCreateModal(false)
                    setEditingRoom(null)
                  }}
                >
                  Отмена
                </button>
              </div>
            </form>
        </Dialog>
      )}
    </div>
  )
}

export default ManageRooms







