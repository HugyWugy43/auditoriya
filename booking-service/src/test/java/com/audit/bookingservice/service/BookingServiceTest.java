package com.audit.bookingservice.service;
import com.audit.bookingservice.model.*;
import com.audit.bookingservice.repository.BookingRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;
import reactor.core.publisher.Mono;
import java.time.LocalDateTime;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
@ExtendWith(MockitoExtension.class)
class BookingServiceTest {
 @Mock BookingRepository bookingRepository;
 @Mock ExternalServiceClient externalServiceClient;
 @Mock JdbcTemplate jdbc;
 @InjectMocks BookingService service;
 Booking booking() { Booking b = new Booking(); b.setRoomId(1L); b.setUserId(2L); b.setStartTime(LocalDateTime.now().plusDays(1)); b.setEndTime(b.getStartTime().plusHours(1)); b.setStatus(BookingStatus.CONFIRMED); return b; }
 void available() { when(externalServiceClient.getUserRole(2L)).thenReturn(Mono.just("TEACHER")); when(externalServiceClient.roomIsActive(1L)).thenReturn(Mono.just(true)); }
 @Test void rejectsZeroDuration() { Booking b = booking(); b.setEndTime(b.getStartTime()); assertThrows(IllegalArgumentException.class, () -> service.createBooking(b)); verifyNoInteractions(bookingRepository); }
 @Test void rejectsPastStart() { Booking b = booking(); b.setStartTime(LocalDateTime.now().minusMinutes(1)); assertThrows(IllegalArgumentException.class, () -> service.createBooking(b)); }
 @Test void rejectsInactiveRoom() { Booking b = booking(); when(externalServiceClient.getUserRole(2L)).thenReturn(Mono.just("TEACHER")); when(externalServiceClient.roomIsActive(1L)).thenReturn(Mono.just(false)); assertThrows(IllegalArgumentException.class, () -> service.createBooking(b)); verify(bookingRepository, never()).save(any()); }
 @Test void rejectsConflict() { available(); Booking existing = booking(); existing.setId(10L); when(bookingRepository.findConflictingBookings(any(),any(),any())).thenReturn(List.of(existing)); assertThrows(IllegalArgumentException.class, () -> service.createBooking(booking())); verify(bookingRepository, never()).save(any()); }
 @Test void locksBeforeCheckingAndClearsClientId() { available(); Booking b = booking(); b.setId(99L); when(bookingRepository.save(any())).thenAnswer(i -> i.getArgument(0)); service.createBooking(b); InOrder order = inOrder(jdbc, bookingRepository); order.verify(jdbc).queryForList("SELECT pg_advisory_xact_lock(?)", 1L); order.verify(bookingRepository).findConflictingBookings(any(),any(),any()); order.verify(bookingRepository).save(b); assertNull(b.getId()); assertEquals(BookingStatus.CONFIRMED,b.getStatus()); }
 @Test void updateChecksOverlap() { Booking b = booking(); b.setId(1L); Booking other = booking(); other.setId(3L); when(bookingRepository.findById(1L)).thenReturn(Optional.of(b)); when(externalServiceClient.roomIsActive(1L)).thenReturn(Mono.just(true)); when(bookingRepository.findConflictingBookings(any(),any(),any())).thenReturn(List.of(other)); assertThrows(IllegalArgumentException.class, () -> service.updateBooking(1L,booking())); verify(bookingRepository, never()).save(any()); }
 @Test void teacherCannotCancelSomeoneElsesBooking() { Booking b = booking(); when(bookingRepository.findById(1L)).thenReturn(Optional.of(b)); when(externalServiceClient.getUserRole(3L)).thenReturn(Mono.just("TEACHER")); assertThrows(IllegalArgumentException.class, () -> service.cancelBooking(1L,3L)); }
 @Test void cannotResurrectCancelledBooking() { Booking b = booking(); b.setStatus(BookingStatus.CANCELLED); when(bookingRepository.findById(1L)).thenReturn(Optional.of(b)); assertThrows(IllegalArgumentException.class, () -> service.updateBooking(1L,booking())); }
 @Test void schedulerCompletesWithoutBrowser() { when(jdbc.queryForList(startsWith("UPDATE bookings"), any(LocalDateTime.class), any(LocalDateTime.class))).thenReturn(List.of(Map.of("id",1L,"user_id",2L,"room_id",3L))); service.completeExpiredBookings(); verify(jdbc).update(startsWith("INSERT INTO booking_outbox"),any(UUID.class),eq(1L),eq(2L),eq(3L),eq("COMPLETED"),anyString()); }
}
