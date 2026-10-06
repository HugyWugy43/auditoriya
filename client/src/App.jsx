import React, { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, NavLink, Navigate, Link, useLocation, useNavigate } from 'react-router-dom'
import Notifications from './components/Notifications'
import Rooms from './components/Rooms'
import Bookings from './components/Bookings'
import CreateBooking from './components/CreateBooking'
import Users from './components/Users'
import ManageRooms from './components/ManageRooms'
import Login from './components/Login'
import Register from './components/Register'
import Icon from './components/Icon'
import { roles } from './utils/booking.mjs'
import { api } from './services/api'
import './index.css'
function Workspace({ user, logout }) {
 const location = useLocation(), navigate = useNavigate()
 const [search, setSearch] = useState(''), [menu, setMenu] = useState(false)
 const [unread,setUnread] = useState(null)
 useEffect(() => { let active=true; const refresh=()=>api.getNotifications().then(r=>{if(active)setUnread(r.data.unread)}).catch(()=>{if(active)setUnread(null)}); refresh(); const timer=setInterval(()=>{if(!document.hidden)refresh()},30000); window.addEventListener('notifications:read',refresh); return ()=>{active=false;clearInterval(timer);window.removeEventListener('notifications:read',refresh)} },[])
 const canBook = ['ADMIN', 'TEACHER'].includes(user.role)
 const links = [['/', 'grid', 'Обзор'], ['/rooms', 'room', 'Аудитории'], ['/schedule', 'calendar', 'Расписание'], ['/favorites', 'star', 'Избранное'], ['/bookings', 'clock', 'Бронирования'], ['/notifications', 'bell', 'Уведомления']]
 if (user.role === 'ADMIN') links.push(['/manage-rooms', 'settings', 'Управление'], ['/users', 'users', 'Пользователи'])
 const title = links.find(([path]) => path === location.pathname)?.[2] || (location.pathname === '/profile' ? 'Личный кабинет' : 'Новое бронирование')
 useEffect(() => { setMenu(false) }, [location.pathname])
 useEffect(() => {
  const shortcut = e => { if (e.key === 'Escape') setMenu(false); if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); document.getElementById('global-search')?.focus() } }
  window.addEventListener('keydown', shortcut); return () => window.removeEventListener('keydown', shortcut)
 }, [])
 return <div className="app-shell">
  <a className="skip-link" href="#main-content">Перейти к содержимому</a>
  <aside className={`sidebar ${menu ? 'is-open' : ''}`}>
   <Link className="brand" to="/"><span className="brand-mark"><Icon name="room" size={25}/></span><span>аудитория<span className="brand-dot">.</span><small>ПРОСТРАНСТВО ДЛЯ ЗНАНИЙ</small></span></Link>
   <div className="nav-caption">ВАШ КАМПУС</div>
   <nav aria-label="Основная навигация">{links.map(([path, icon, label]) => <NavLink end to={path} key={path}><Icon name={icon}/><span>{label}</span>{path === '/' && <span className="nav-spark">↗</span>}</NavLink>)}</nav>
   <div className="sidebar-bottom"><div className="sidebar-note"><span className="small-orbit"/><strong>Место для ваших идей</strong><p>Найдите пространство<br/>для следующего занятия.</p>{canBook && <Link to="/create-booking">Забронировать <Icon name="arrow" size={16}/></Link>}</div><button className="logout" onClick={logout}><Icon name="logout"/>Выйти из аккаунта</button><small className="sidebar-version">Система бронирования · 2026</small></div>
  </aside>
  <div className="workspace">
   <header className="topbar"><div className="breadcrumb"><button className="icon-button mobile-menu" aria-label="Открыть меню" aria-expanded={menu} onClick={() => setMenu(!menu)}><Icon name="menu"/></button><span>Кампус</span><span>/</span><strong>{title}</strong></div><div className="topbar-actions"><form className="global-search" onSubmit={e => { e.preventDefault(); navigate(`/rooms?q=${encodeURIComponent(search)}`) }}><Icon name="search" size={17}/><input id="global-search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Найти аудиторию…" aria-label="Поиск аудитории"/><kbd>Ctrl K</kbd></form><Link className="icon-button notification-link" to="/notifications" aria-label={unread == null ? "Уведомления" : `Уведомления: ${unread} непрочитанных`}><Icon name="bell"/>{unread > 0 && <span className="notification-count">{unread > 99 ? "99+" : unread}</span>}</Link><Link className="profile-link" to="/profile"><span className="avatar">{user.firstName?.[0]}{user.lastName?.[0]}</span><span>{user.firstName || user.username}<small>{roles[user.role]}</small></span><span>⌄</span></Link></div></header>
   <main id="main-content" className="main-content" key={location.pathname}><Routes>
    <Route path="/" element={<Rooms currentUser={user} mode="overview"/>}/><Route path="/rooms" element={<Rooms currentUser={user} mode="rooms"/>}/><Route path="/schedule" element={<Rooms currentUser={user} mode="schedule"/>}/><Route path="/favorites" element={<Rooms currentUser={user} mode="favorites"/>}/>
    <Route path="/notifications" element={<Notifications/>}/><Route path="/bookings" element={<Bookings currentUser={user}/>}/>
    <Route path="/create-booking" element={canBook ? <CreateBooking currentUser={user}/> : <Navigate to="/" replace/>}/>
    <Route path="/manage-rooms" element={user.role === 'ADMIN' ? <ManageRooms/> : <Navigate to="/" replace/>}/><Route path="/users" element={user.role === 'ADMIN' ? <Users/> : <Navigate to="/" replace/>}/>
    <Route path="/profile" element={<><div className="page-heading"><div><span className="eyebrow">ВАШ АККАУНТ</span><h1>Личный кабинет</h1></div></div><section className="card profile-card"><span className="avatar large">{user.firstName?.[0]}{user.lastName?.[0]}</span><h2>{user.firstName} {user.lastName}</h2><p>{roles[user.role]} · @{user.username}</p><p>{user.email}</p><div className="button-row"><Link className="btn btn-primary" to="/bookings?mine=1">Мои бронирования <Icon name="arrow"/></Link><Link className="btn btn-secondary" to="/favorites">Избранные аудитории</Link></div></section></>}/>
    <Route path="*" element={<Navigate to="/" replace/>}/>
   </Routes></main>
  </div>
 </div>
}
export default function App() {
 const [user, setUser] = useState(null), [loading, setLoading] = useState(true), [authError, setAuthError] = useState(false), [register, setRegister] = useState(false)
 const checkAuth = async () => {
  setLoading(true); setAuthError(false)
  try { if (localStorage.getItem('token')) { const response = await api.validateToken(); setUser(response.data) } }
  catch (err) { if (err.response?.status !== 401) setAuthError(true) }
  finally { setLoading(false) }
 }
 useEffect(() => { checkAuth() }, [])
 const login = data => { localStorage.setItem('token', data.token); setUser(data); setRegister(false) }
 const logout = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); setUser(null); setRegister(false) }
 if (loading) return <div className="boot-screen"><span className="loader"/><p>Открываем ваш кампус…</p></div>
 if (authError) return <div className="boot-screen"><h2>Сервер временно недоступен</h2><p>Сессия сохранена. Попробуйте подключиться ещё раз.</p><button className="btn btn-primary" onClick={checkAuth}>Повторить</button></div>
 if (!user) return register ? <Register onRegister={login} onBackToLogin={() => setRegister(false)}/> : <Login onLogin={login} onShowRegister={() => setRegister(true)}/>
 return <BrowserRouter><Workspace user={user} logout={logout}/></BrowserRouter>
}

