package com.audit.userservice.config;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
@Configuration
public class SecurityConfig {
    @Bean public PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(); }
    @Bean public FilterRegistrationBean<MutationAuthorization> disableDoubleRegistration(MutationAuthorization filter) {
        FilterRegistrationBean<MutationAuthorization> registration = new FilterRegistrationBean<>(filter);
        registration.setEnabled(false); return registration;
    }
    @Bean public SecurityFilterChain securityFilterChain(HttpSecurity http, MutationAuthorization filter) throws Exception {
        return http.csrf(c -> c.disable()).cors(c -> c.disable())
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .addFilterBefore(filter, UsernamePasswordAuthenticationFilter.class)
            .authorizeHttpRequests(a -> a
                .requestMatchers(org.springframework.http.HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers("/api/auth/login", "/api/auth/register", "/actuator/health/**", "/error").permitAll()
                .requestMatchers("/internal/**").hasRole("SERVICE")
                .requestMatchers("/api/users/me", "/api/auth/validate").authenticated()
                .requestMatchers("/api/users/**").hasRole("ADMIN")
                .anyRequest().denyAll())
            .build();
    }
}
