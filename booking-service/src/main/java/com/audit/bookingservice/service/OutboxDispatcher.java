package com.audit.bookingservice.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.RestClientException;
import java.time.Duration;
import java.util.Map;

@Service
public class OutboxDispatcher {
    private final JdbcTemplate jdbc;
    private final RestTemplate client;
    private final String url;
    public OutboxDispatcher(JdbcTemplate jdbc, RestTemplateBuilder builder,
            @Value("${services.notification.url}") String url,
            @Value("${security.internal-token}") String token) {
        this.jdbc=jdbc; this.url=url;
        client=builder.connectTimeout(Duration.ofSeconds(2)).readTimeout(Duration.ofSeconds(3)).defaultHeader("X-Service-Token",token).build();
    }
    @Scheduled(fixedDelayString="${notifications.dispatch-delay:2000}")
    @Transactional
    public void deliver() {
        var events=jdbc.queryForList("SELECT * FROM booking_outbox WHERE delivered_at IS NULL AND next_attempt_at<=CURRENT_TIMESTAMP ORDER BY created_at LIMIT 10 FOR UPDATE SKIP LOCKED");
        for(var event:events) {
            Object id=event.get("event_id");
            try {
                client.postForEntity(url+"/internal/notifications/events",Map.of(
                    "eventId",id,"bookingId",event.get("booking_id"),"userId",event.get("user_id"),
                    "roomId",event.get("room_id"),"kind",event.get("kind"),"message",event.get("message")),Void.class);
                jdbc.update("UPDATE booking_outbox SET delivered_at=CURRENT_TIMESTAMP WHERE event_id=?",id);
            } catch(RestClientException ex) {
                int attempts=((Number)event.get("attempts")).intValue()+1;
                int delay=Math.min(300, 1 << Math.min(attempts,8));
                jdbc.update("UPDATE booking_outbox SET attempts=?,next_attempt_at=CURRENT_TIMESTAMP + (? * INTERVAL '1 second') WHERE event_id=?", attempts,delay,id);
            }
        }
    }
}
