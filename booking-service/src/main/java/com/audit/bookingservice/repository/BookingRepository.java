package com.audit.bookingservice.repository;
import com.audit.bookingservice.model.Booking;
import com.audit.bookingservice.model.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.List;
public interface BookingRepository extends JpaRepository<Booking, Long>, org.springframework.data.jpa.repository.JpaSpecificationExecutor<Booking> {
 List<Booking> findByUserId(Long userId);
 List<Booking> findByRoomId(Long roomId);
 List<Booking> findByStatus(BookingStatus status);
 @Query("SELECT b FROM Booking b WHERE b.roomId = :roomId AND b.status IN (com.audit.bookingservice.model.BookingStatus.CONFIRMED, com.audit.bookingservice.model.BookingStatus.PENDING) AND b.startTime < :endTime AND b.endTime > :startTime")
 List<Booking> findConflictingBookings(@Param("roomId") Long roomId, @Param("startTime") LocalDateTime startTime, @Param("endTime") LocalDateTime endTime);
 @Modifying(clearAutomatically = true, flushAutomatically = true)
 @Query("UPDATE Booking b SET b.status = com.audit.bookingservice.model.BookingStatus.COMPLETED, b.updatedAt = :now, b.version = b.version + 1 WHERE b.endTime <= :now AND b.status IN (com.audit.bookingservice.model.BookingStatus.CONFIRMED, com.audit.bookingservice.model.BookingStatus.PENDING)")
 int completeExpired(@Param("now") LocalDateTime now);
}
