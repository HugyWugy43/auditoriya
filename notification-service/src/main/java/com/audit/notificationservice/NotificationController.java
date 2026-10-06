package com.audit.notificationservice;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.*;
import org.springframework.web.server.ResponseStatusException;
import java.time.*;
import java.util.*;

@RestController
public class NotificationController {
    private final JdbcTemplate jdbc;
    private final RestTemplate rooms;
    private final String roomUrl;
    public NotificationController(JdbcTemplate jdbc, RestTemplateBuilder builder,
            @Value("${services.room.url}") String roomUrl,@Value("${security.internal-token}") String secret) {
        this.jdbc=jdbc; this.roomUrl=roomUrl;
        rooms=builder.connectTimeout(Duration.ofSeconds(2)).readTimeout(Duration.ofSeconds(3)).defaultHeader("X-Service-Token",secret).build();
    }
    public record Event(@NotNull UUID eventId,@NotNull @Positive Long bookingId,@NotNull @Positive Long userId,
                        @NotNull @Positive Long roomId,@NotBlank @Size(max=40) String kind,@NotBlank @Size(max=1500) String message) {}
    public record Notification(Long id,Long bookingId,Long roomId,String kind,String message,boolean isRead,LocalDateTime createdAt) {}
    @PostMapping("/internal/notifications/events") @Transactional
    public ResponseEntity<Void> receive(@Valid @RequestBody Event event) {
        if (!Set.of("CREATED","UPDATED","CANCELLED","COMPLETED").contains(event.kind())) throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
        if (jdbc.update("INSERT INTO received_events(event_id) VALUES (?) ON CONFLICT DO NOTHING",event.eventId())==0) return ResponseEntity.noContent().build();
        Set<Long> recipients=new HashSet<>(jdbc.queryForList("SELECT user_id FROM room_subscriptions WHERE room_id=?",Long.class,event.roomId()));
        recipients.add(event.userId());
        for(Long user:recipients) jdbc.update("INSERT INTO notifications(event_id,user_id,booking_id,room_id,kind,message) VALUES (?,?,?,?,?,?) ON CONFLICT DO NOTHING",
                event.eventId(),user,event.bookingId(),event.roomId(),event.kind(),event.message());
        return ResponseEntity.noContent().build();
    }
    @GetMapping("/api/notifications") public Map<String,Object> list(@RequestAttribute Long actorId,
            @RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size) {
        if(page<0||size<1||size>100) throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
        var content=jdbc.query("SELECT * FROM notifications WHERE user_id=? ORDER BY id DESC LIMIT ? OFFSET ?",
            (rs,n)->new Notification(rs.getLong("id"),rs.getLong("booking_id"),rs.getLong("room_id"),rs.getString("kind"),rs.getString("message"),rs.getBoolean("is_read"),rs.getTimestamp("created_at").toLocalDateTime()),actorId,size,(long)page*size);
        long total=jdbc.queryForObject("SELECT count(*) FROM notifications WHERE user_id=?",Long.class,actorId);
        long unread=jdbc.queryForObject("SELECT count(*) FROM notifications WHERE user_id=? AND NOT is_read",Long.class,actorId);
        return Map.of("content",content,"number",page,"totalElements",total,"totalPages",(total+size-1)/size,"unread",unread);
    }
    @PostMapping("/api/notifications/{id}/read") public ResponseEntity<Void> markRead(@PathVariable Long id,@RequestAttribute Long actorId) {
        int updated=jdbc.update("UPDATE notifications SET is_read=true WHERE id=? AND user_id=?",id,actorId);
        return updated==0?ResponseEntity.notFound().build():ResponseEntity.noContent().build();
    }
    @GetMapping("/api/subscriptions/rooms") public List<Long> subscriptions(@RequestAttribute Long actorId) {
        return jdbc.queryForList("SELECT room_id FROM room_subscriptions WHERE user_id=? ORDER BY room_id",Long.class,actorId);
    }
    @PutMapping("/api/subscriptions/rooms/{id}") public ResponseEntity<Void> subscribe(@PathVariable Long id,@RequestAttribute Long actorId) {
        if(id<=0) throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
        try { rooms.getForEntity(roomUrl+"/internal/rooms/"+id,Object.class); }
        catch(HttpClientErrorException.NotFound ex) { return ResponseEntity.notFound().build(); }
        catch(RestClientException ex) { throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE); }
        jdbc.update("INSERT INTO room_subscriptions(user_id,room_id) VALUES (?,?) ON CONFLICT DO NOTHING",actorId,id);
        return ResponseEntity.noContent().build();
    }
    @DeleteMapping("/api/subscriptions/rooms/{id}") public ResponseEntity<Void> unsubscribe(@PathVariable Long id,@RequestAttribute Long actorId) {
        jdbc.update("DELETE FROM room_subscriptions WHERE user_id=? AND room_id=?",actorId,id);
        return ResponseEntity.noContent().build();
    }
}
