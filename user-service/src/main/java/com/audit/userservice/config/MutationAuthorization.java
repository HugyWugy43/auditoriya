package com.audit.userservice.config;

import com.audit.userservice.service.AuthService;
import com.audit.userservice.model.User;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.List;

@Component
public class MutationAuthorization extends OncePerRequestFilter {
    private final AuthService auth;
    private final byte[] internalToken;
    public MutationAuthorization(AuthService auth, @Value("${security.internal-token}") String secret) {
        if (secret.length() < 32) throw new IllegalStateException("INTERNAL_SERVICE_TOKEN must contain at least 32 characters");
        this.auth = auth; this.internalToken = secret.getBytes(StandardCharsets.UTF_8);
    }
    @Override protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String path = request.getServletPath();
        if ("OPTIONS".equals(request.getMethod()) || path.startsWith("/actuator/health") || path.equals("/error") ||
                path.equals("/api/auth/login") || path.equals("/api/auth/register")) { chain.doFilter(request, response); return; }
        if (path.startsWith("/internal/")) {
            String token = request.getHeader("X-Service-Token");
            if (token == null || !MessageDigest.isEqual(internalToken, token.getBytes(StandardCharsets.UTF_8))) { reject(response, 401); return; }
            SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken("service", null, List.of(new SimpleGrantedAuthority("ROLE_SERVICE"))));
        } else {
            String token = request.getHeader("Authorization");
            if (token == null || !token.startsWith("Bearer ")) { reject(response, 401); return; }
            User actor;
            try { actor = auth.validateToken(token.substring(7)); } catch (IllegalArgumentException e) { reject(response, 401); return; } catch (org.springframework.dao.DataAccessException e) { reject(response,503); return; }
            request.setAttribute("actorId", actor.getId()); request.setAttribute("actorRole", actor.getRole().name());
            SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(actor.getId(), null, List.of(new SimpleGrantedAuthority("ROLE_" + actor.getRole().name()))));
        }
        chain.doFilter(request, response);
    }
    private void reject(HttpServletResponse response, int status) throws IOException {
        response.setStatus(status); response.setContentType("application/json"); response.getWriter().write("{\"message\":\"Authentication required\"}");
    }
}
