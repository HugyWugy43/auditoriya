package com.audit.bookingservice.service;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;
import com.fasterxml.jackson.databind.JsonNode;
import java.time.Duration;
@Service
public class ExternalServiceClient {
    private final WebClient users, rooms;
    public ExternalServiceClient(@Value("${services.user.url}") String userUrl,
            @Value("${services.room.url}") String roomUrl,
            @Value("${security.internal-token}") String token) {
        users = WebClient.builder().baseUrl(userUrl).defaultHeader("X-Service-Token",token).build();
        rooms = WebClient.builder().baseUrl(roomUrl).defaultHeader("X-Service-Token",token).build();
    }
    public Mono<Boolean> roomIsActive(Long id) {
        return rooms.get().uri("/internal/rooms/{id}",id).retrieve().bodyToMono(JsonNode.class)
            .map(r -> r.path("isActive").asBoolean(false)).timeout(Duration.ofSeconds(4))
            .onErrorResume(WebClientResponseException.NotFound.class, e -> Mono.just(false));
    }
    public Mono<String> getUserRole(Long id) {
        return users.get().uri("/internal/users/{id}",id).retrieve().bodyToMono(JsonNode.class)
            .map(r -> r.path("active").asBoolean(false) ? r.path("role").asText("UNKNOWN") : "UNKNOWN")
            .timeout(Duration.ofSeconds(4)).onErrorResume(WebClientResponseException.NotFound.class, e -> Mono.just("UNKNOWN"));
    }
}
