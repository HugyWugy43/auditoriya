package com.audit.bookingservice.service;

import com.audit.bookingservice.model.Booking;
import com.audit.bookingservice.model.BookingStatus;
import com.audit.bookingservice.repository.BookingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class BookingService {
 @Autowired private BookingRepository bookingRepository;
 @Autowired private ExternalServiceClient externalServiceClient;
 @Autowired private JdbcTemplate jdbc;
 public List<Booking> getAllBookings() { return bookingRepository.findAll(); }
 public Optional<Booking> getBookingById(Long id) { return bookingRepository.findById(id); }
 public List<Booking> getBookingsByUserId(Long id) { return bookingRepository.findByUserId(id); }
 public List<Booking> getBookingsByRoomId(Long id) { return bookingRepository.findByRoomId(id); }

 // The transaction-scoped PostgreSQL lock also protects simultaneous requests across service replicas.
 private void lockRoom(Long roomId) {
  if (roomId == null || roomId <= 0) throw new IllegalArgumentException("Укажите аудиторию");
  jdbc.queryForList("SELECT pg_advisory_xact_lock(?)", roomId);
 }
 private void validateInterval(LocalDateTime start, LocalDateTime end) {
  if (start == null || end == null || !start.isBefore(end)) throw new IllegalArgumentException("Время окончания должно быть позже начала");
 }
 private void validateRoom(Long roomId) {
  if (!Boolean.TRUE.equals(externalServiceClient.roomIsActive(roomId).block())) throw new IllegalArgumentException("Аудитория не существует или недоступна для бронирования");
 }
 private void checkConflicts(Long room, LocalDateTime start, LocalDateTime end, Long exclude) {
  if (bookingRepository.findConflictingBookings(room, start, end).stream().anyMatch(b -> !b.getId().equals(exclude))) throw new IllegalArgumentException("Аудитория уже забронирована на это время");
 }
 public Booking createBooking(Booking booking) {
  validateInterval(booking.getStartTime(), booking.getEndTime());
  if (!booking.getStartTime().isAfter(LocalDateTime.now(java.time.ZoneId.of("Europe/Moscow")))) throw new IllegalArgumentException("Время начала должно быть в будущем");
  String role = externalServiceClient.getUserRole(booking.getUserId()).block();
  if (!"TEACHER".equals(role) && !"ADMIN".equals(role)) throw new IllegalArgumentException("Бронировать могут только преподаватели и администраторы");
  validateRoom(booking.getRoomId());
  lockRoom(booking.getRoomId());
  checkConflicts(booking.getRoomId(), booking.getStartTime(), booking.getEndTime(), null);
  booking.setId(null);
  booking.setStatus(BookingStatus.CONFIRMED);
  Booking saved = bookingRepository.save(booking);
  recordEvent(saved, "CREATED", "Бронирование создано");
  return saved;
 }
 public Optional<Booking> updateBooking(Long id, Booking details) {
  return bookingRepository.findById(id).map(booking -> {
   lockRoom(booking.getRoomId());
   if (booking.getStatus() == BookingStatus.CANCELLED || booking.getStatus() == BookingStatus.COMPLETED || !booking.getEndTime().isAfter(LocalDateTime.now(java.time.ZoneId.of("Europe/Moscow")))) throw new IllegalArgumentException("Завершённую или отменённую бронь нельзя изменить");
   LocalDateTime start = details.getStartTime() == null ? booking.getStartTime() : details.getStartTime();
   LocalDateTime end = details.getEndTime() == null ? booking.getEndTime() : details.getEndTime();
   validateInterval(start, end);
   if (!start.equals(booking.getStartTime()) && !start.isAfter(LocalDateTime.now(java.time.ZoneId.of("Europe/Moscow")))) throw new IllegalArgumentException("Время начала должно быть в будущем");
   if (!end.isAfter(LocalDateTime.now(java.time.ZoneId.of("Europe/Moscow")))) throw new IllegalArgumentException("Время окончания должно быть в будущем");
   if (details.getStatus() != null && details.getStatus() != booking.getStatus()) throw new IllegalArgumentException("Для отмены используйте действие отмены; завершение выполняется автоматически");
   validateRoom(booking.getRoomId());
   checkConflicts(booking.getRoomId(), start, end, id);
   booking.setStartTime(start); booking.setEndTime(end);
   if (details.getPurpose() != null) booking.setPurpose(details.getPurpose());
   Booking saved = bookingRepository.save(booking);
   recordEvent(saved, "UPDATED", "Бронирование изменено");
   return saved;
  });
 }
 public Optional<Booking> resolveLegacy(Long id, LocalDateTime start, LocalDateTime end) {
  return bookingRepository.findById(id).map(b -> {
   lockRoom(b.getRoomId());
   if (b.getStatus() != BookingStatus.NEEDS_REVIEW) throw new IllegalArgumentException("Запись уже проверена");
   validateInterval(start,end);
   if (!start.isAfter(LocalDateTime.now(java.time.ZoneId.of("Europe/Moscow")))) throw new IllegalArgumentException("Выберите новое время в будущем");
   validateRoom(b.getRoomId());
   String role = externalServiceClient.getUserRole(b.getUserId()).block();
   if (!"TEACHER".equals(role) && !"ADMIN".equals(role)) throw new IllegalArgumentException("Организатор недоступен. Отмените запись и создайте новую.");
   checkConflicts(b.getRoomId(),start,end,id);
   b.setStartTime(start); b.setEndTime(end); b.setStatus(BookingStatus.CONFIRMED);
   Booking saved = bookingRepository.save(b); recordEvent(saved,"UPDATED","Бронирование проверено и перенесено"); return saved;
  });
 }
 public boolean cancelBooking(Long id, Long userId) {
  return bookingRepository.findById(id).map(booking -> {
   String role = externalServiceClient.getUserRole(userId).block();
   if (!"ADMIN".equals(role) && !("TEACHER".equals(role) && booking.getUserId().equals(userId))) throw new IllegalArgumentException("Можно отменять только собственные бронирования");
   if (booking.getStatus() != BookingStatus.NEEDS_REVIEW && (booking.getStatus() == BookingStatus.COMPLETED || !booking.getEndTime().isAfter(LocalDateTime.now(java.time.ZoneId.of("Europe/Moscow"))))) throw new IllegalArgumentException("Занятие уже завершено");
   if (booking.getStatus() == BookingStatus.CANCELLED) return true;
   booking.setStatus(BookingStatus.CANCELLED); bookingRepository.save(booking);
   recordEvent(booking, "CANCELLED", "Бронирование отменено"); return true;
  }).orElse(false);
 }
 @Scheduled(fixedDelay = 30000)
 public void completeExpiredBookings() {
  var rows = jdbc.queryForList("UPDATE bookings SET status='COMPLETED', updated_at=?, version=version+1 WHERE end_time<=? AND status IN ('CONFIRMED','PENDING') RETURNING id,user_id,room_id", LocalDateTime.now(java.time.ZoneId.of("Europe/Moscow")), LocalDateTime.now(java.time.ZoneId.of("Europe/Moscow")));
  for (var row : rows) {
   jdbc.update("INSERT INTO booking_outbox(event_id,booking_id,user_id,room_id,kind,message) VALUES (?,?,?,?,?,?)", java.util.UUID.randomUUID(),row.get("id"),row.get("user_id"),row.get("room_id"),"COMPLETED","Занятие завершено. Аудитория #"+row.get("room_id"));
  }
 }
 private void recordEvent(Booking b, String kind, String message) {
  jdbc.update("INSERT INTO booking_outbox(event_id,booking_id,user_id,room_id,kind,message) VALUES (?,?,?,?,?,?)", java.util.UUID.randomUUID(),b.getId(),b.getUserId(),b.getRoomId(),kind,message+". Аудитория #"+b.getRoomId()+", "+b.getStartTime()+" — "+b.getEndTime());
 }
}

