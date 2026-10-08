import test from 'node:test'
import assert from 'node:assert/strict'
import { roomState, overlaps, dayBookings, effectiveStatus, localDate } from '../src/utils/booking.ts'
const room = { id: 1, isActive: true }
const booking = { roomId: 1, status: 'CONFIRMED', startTime: '2026-10-05T10:00:00', endTime: '2026-10-05T11:00:00' }
test('future booking does not occupy a room now', () => { const state = roomState(room,[booking],new Date('2026-10-05T09:00:00+03:00')); assert.equal(state.key,'free'); assert.equal(state.next,booking) })
test('occupancy includes start and excludes end', () => { assert.equal(roomState(room,[booking],new Date(booking.startTime+'+03:00')).key,'busy'); assert.equal(roomState(room,[booking],new Date(booking.endTime+'+03:00')).key,'free') })
test('cancelled and completed bookings do not block rooms', () => { for (const status of ['CANCELLED','COMPLETED']) assert.equal(roomState(room,[{...booking,status}],new Date(booking.startTime+'+03:00')).key,'free') })
test('inactive rooms are unavailable even without bookings', () => assert.equal(roomState({...room,isActive:false},[]).key,'offline'))
test('nearest future booking is selected regardless of API order', () => { const later = {...booking,startTime:'2026-10-05T12:00:00',endTime:'2026-10-05T13:00:00'}; assert.equal(roomState(room,[later,booking],new Date('2026-10-05T09:00:00+03:00')).next,booking) })
test('adjacent slots do not overlap', () => assert.equal(overlaps(booking,'2026-10-05T11:00:00','2026-10-05T12:00:00'),false))
test('enclosing and partial intervals overlap', () => { assert.equal(overlaps(booking,'2026-10-05T09:00:00','2026-10-05T12:00:00'),true); assert.equal(overlaps(booking,'2026-10-05T10:30:00','2026-10-05T12:00:00'),true) })
test('overnight booking appears on both days', () => { const b={...booking,startTime:'2026-10-04T23:00:00',endTime:'2026-10-05T01:00:00'}; assert.equal(dayBookings([b],'2026-10-04').length,1); assert.equal(dayBookings([b],'2026-10-05').length,1); assert.equal(dayBookings([b],'2026-10-06').length,0) })
test('expired status is derived without a write request', () => assert.equal(effectiveStatus(booking,new Date('2026-10-05T11:01:00+03:00')),'COMPLETED'))
test('local day does not shift to UTC', () => assert.equal(localDate(new Date('2026-10-04T21:15:00Z')),'2026-10-05'))

