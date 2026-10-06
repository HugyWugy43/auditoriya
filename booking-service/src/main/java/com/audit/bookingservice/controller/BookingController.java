package com.audit.bookingservice.controller;

import com.audit.bookingservice.model.*;
import com.audit.bookingservice.dto.BookingView;
import com.audit.bookingservice.repository.BookingRepository;
import com.audit.bookingservice.service.BookingService;
import jakarta.validation.Valid;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {
    private final BookingService service;
    private final BookingRepository repository;
    public BookingController(BookingService service, BookingRepository repository) { this.service = service; this.repository = repository; }
    public record PageView<T>(List<T> content, int number, int size, long totalElements, int totalPages, boolean last) {
        static <T> PageView<T> of(Page<T> page) { return new PageView<>(page.getContent(),page.getNumber(),page.getSize(),page.getTotalElements(),page.getTotalPages(),page.isLast()); }
    }
    @GetMapping public PageView<BookingView> all(
            @RequestParam(defaultValue="0") int page, @RequestParam(defaultValue="25") int size,
            @RequestParam(required=false) Long roomId, @RequestParam(required=false) Long userId,
            @RequestParam(required=false) BookingStatus status, @RequestParam(defaultValue="") String q,
            @RequestParam(required=false) @DateTimeFormat(iso=DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required=false) @DateTimeFormat(iso=DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @RequestAttribute Long actorId, @RequestAttribute String actorRole) {
        if (page < 0 || size < 1 || size > 100 || q.length() > 200) throw new IllegalArgumentException("Некорректные параметры страницы");
        if (from != null && to != null && !from.isBefore(to)) throw new IllegalArgumentException("Некорректный интервал поиска");
        if (userId != null && !"ADMIN".equals(actorRole) && !userId.equals(actorId)) throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        Specification<Booking> filter = (root,query,cb) -> {
            List<jakarta.persistence.criteria.Predicate> terms = new ArrayList<>();
            if (roomId != null) terms.add(cb.equal(root.get("roomId"),roomId));
            if (userId != null) terms.add(cb.equal(root.get("userId"),userId));
            if (status != null) terms.add(cb.equal(root.get("status"),status));
            if (from != null) terms.add(cb.greaterThan(root.get("endTime"),from));
            if (to != null) terms.add(cb.lessThan(root.get("startTime"),to));
            if (!q.isBlank()) {
                String escaped = q.toLowerCase(Locale.ROOT).replace("\\","\\\\").replace("%","\\%").replace("_","\\_");
                var text = cb.like(cb.lower(root.get("purpose")), "%"+escaped+"%", '\\');
                if (!"ADMIN".equals(actorRole)) terms.add(cb.equal(root.get("userId"),actorId));
                terms.add(text);
            }
            return cb.and(terms.toArray(jakarta.persistence.criteria.Predicate[]::new));
        };
        return PageView.of(repository.findAll(filter,PageRequest.of(page,size,Sort.by(Sort.Order.desc("startTime"),Sort.Order.desc("id")))).map(b -> BookingView.of(b,actorId,actorRole)));
    }
    @GetMapping("/{id}") public ResponseEntity<BookingView> get(@PathVariable Long id, @RequestAttribute Long actorId, @RequestAttribute String actorRole) {
        return service.getBookingById(id).map(b -> BookingView.of(b,actorId,actorRole)).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }
    @PostMapping public ResponseEntity<BookingView> create(@Valid @RequestBody Booking booking, @RequestAttribute Long actorId, @RequestAttribute String actorRole) {
        if (!"ADMIN".equals(actorRole)) booking.setUserId(actorId);
        return ResponseEntity.status(201).body(BookingView.of(service.createBooking(booking),actorId,actorRole));
    }
    @PutMapping("/{id}") public ResponseEntity<BookingView> update(@PathVariable Long id, @Valid @RequestBody Booking booking, @RequestAttribute Long actorId, @RequestAttribute String actorRole) {
        checkOwner(id,actorId,actorRole);
        return service.updateBooking(id,booking).map(b -> BookingView.of(b,actorId,actorRole)).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }
    public record ReviewRequest(@jakarta.validation.constraints.NotNull LocalDateTime startTime, @jakarta.validation.constraints.NotNull LocalDateTime endTime) {}
    @PostMapping("/{id}/review") public ResponseEntity<BookingView> review(@PathVariable Long id, @Valid @RequestBody ReviewRequest times, @RequestAttribute Long actorId, @RequestAttribute String actorRole) {
        if (!"ADMIN".equals(actorRole)) throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        return service.resolveLegacy(id,times.startTime(),times.endTime()).map(b -> BookingView.of(b,actorId,actorRole)).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }
    @PostMapping("/{id}/cancel") public ResponseEntity<Void> cancel(@PathVariable Long id, @RequestAttribute Long actorId, @RequestAttribute String actorRole) {
        checkOwner(id,actorId,actorRole);
        return service.cancelBooking(id,actorId) ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }
    private void checkOwner(Long id,Long actor,String role) {
        Booking b = service.getBookingById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (!"ADMIN".equals(role) && !b.getUserId().equals(actor)) throw new ResponseStatusException(HttpStatus.FORBIDDEN);
    }
    @ExceptionHandler(IllegalArgumentException.class) public ResponseEntity<?> invalid(IllegalArgumentException e) { return ResponseEntity.badRequest().body(Map.of("message",e.getMessage())); }
    @ExceptionHandler({org.springframework.orm.ObjectOptimisticLockingFailureException.class,org.springframework.dao.DataIntegrityViolationException.class})
    public ResponseEntity<?> concurrentChange() { return ResponseEntity.status(409).body(Map.of("message","Интервал уже занят или запись изменена. Обновите данные.")); }
    @ExceptionHandler({org.springframework.web.reactive.function.client.WebClientException.class,IllegalStateException.class})
    public ResponseEntity<?> unavailable() { return ResponseEntity.status(503).body(Map.of("message","Связанный сервис недоступен. Бронирование не сохранено; повторите позже.")); }
}
