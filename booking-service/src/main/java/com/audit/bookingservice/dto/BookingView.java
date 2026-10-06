package com.audit.bookingservice.dto;
import com.audit.bookingservice.model.Booking;
import com.audit.bookingservice.model.BookingStatus;
import java.time.LocalDateTime;
public record BookingView(Long id, Long userId, Long roomId, LocalDateTime startTime, LocalDateTime endTime, String purpose, BookingStatus status) {
    public static BookingView of(Booking b, Long actor, String role) {
        boolean owner = "ADMIN".equals(role) || b.getUserId().equals(actor);
        return new BookingView(b.getId(), owner ? b.getUserId() : null, b.getRoomId(), b.getStartTime(), b.getEndTime(), owner ? b.getPurpose() : "Занятие", b.getStatus());
    }
}
