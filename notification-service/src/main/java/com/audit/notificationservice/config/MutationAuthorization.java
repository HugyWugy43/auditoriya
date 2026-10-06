package com.audit.notificationservice.config;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.*;
import org.springframework.web.client.*;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.config.annotation.*;
import java.time.Duration;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

@Configuration
public class MutationAuthorization implements WebMvcConfigurer, HandlerInterceptor {
    private final RestTemplate client;
    private final String userUrl;
    private final byte[] serviceToken;
    public MutationAuthorization(RestTemplateBuilder builder,
            @Value("${services.user.url}") String userUrl,
            @Value("${security.internal-token}") String secret) {
        if (secret.length() < 32) throw new IllegalStateException("INTERNAL_SERVICE_TOKEN must contain at least 32 characters");
        client = builder.connectTimeout(Duration.ofSeconds(2)).readTimeout(Duration.ofSeconds(4)).build();
        this.userUrl = userUrl; serviceToken = secret.getBytes(StandardCharsets.UTF_8);
    }
    public void addInterceptors(InterceptorRegistry registry) { registry.addInterceptor(this).addPathPatterns("/api/**", "/internal/**"); }
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        if ("OPTIONS".equals(request.getMethod())) return true;
        if (request.getServletPath().startsWith("/internal/")) {
            String token = request.getHeader("X-Service-Token");
            if (token != null && MessageDigest.isEqual(serviceToken, token.getBytes(StandardCharsets.UTF_8))) return true;
            return reject(response, 401, "Service authentication required");
        }
        String token = request.getHeader("Authorization");
        if (token == null || !token.startsWith("Bearer ")) return reject(response, 401, "Authentication required");
        try {
            HttpHeaders headers = new HttpHeaders(); headers.set("Authorization", token);
            JsonNode user = client.exchange(userUrl + "/api/auth/validate", HttpMethod.POST, new HttpEntity<>(headers), JsonNode.class).getBody();
            if (user == null || !user.hasNonNull("id")) return reject(response, 401, "Invalid session");
            String role = user.path("role").asText();
            boolean read = "GET".equals(request.getMethod());
            if (!read && (false)) return reject(response, 403, "Insufficient permissions");
            request.setAttribute("actorId", user.path("id").asLong()); request.setAttribute("actorRole", role);
            return true;
        } catch (HttpClientErrorException ex) { return reject(response, ex.getStatusCode().value() == 401 ? 401 : 403, "Invalid session"); }
        catch (RestClientException ex) { return reject(response, 503, "Authentication service unavailable; retry later"); }
    }
    private boolean reject(HttpServletResponse response, int status, String message) throws java.io.IOException {
        response.setStatus(status); response.setContentType("application/json");
        response.getWriter().write("{\"message\":\"" + message + "\"}"); return false;
    }
}
