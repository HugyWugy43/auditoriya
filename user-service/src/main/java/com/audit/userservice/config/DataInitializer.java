package com.audit.userservice.config;

import com.audit.userservice.model.User;
import com.audit.userservice.model.UserRole;
import com.audit.userservice.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "bootstrap.enabled", havingValue = "true")
public class DataInitializer implements CommandLineRunner {
    @org.springframework.beans.factory.annotation.Autowired private org.springframework.jdbc.core.JdbcTemplate jdbc;
    private final UserRepository users;
    private final PasswordEncoder passwords;
    private final String username, email, password;
    public DataInitializer(UserRepository users, PasswordEncoder passwords,
            @Value("${bootstrap.username}") String username,
            @Value("${bootstrap.email}") String email,
            @Value("${bootstrap.password}") String password) {
        this.users = users; this.passwords = passwords;
        this.username = username; this.email = email; this.password = password;
    }
    @org.springframework.transaction.annotation.Transactional
    @Override public void run(String... args) {
        jdbc.queryForList("SELECT pg_advisory_xact_lock(9283746)");
        if (users.count() != 0) return; // Never reset an existing account or password.
        if (password == null || password.length() < 16 || password.getBytes(java.nio.charset.StandardCharsets.UTF_8).length > 72) {
            throw new IllegalStateException("Set a strong BOOTSTRAP_ADMIN_PASSWORD before first startup");
        }
        User admin = new User();
        admin.setUsername(username); admin.setEmail(email);
        admin.setPassword(passwords.encode(password));
        admin.setFirstName("Администратор"); admin.setLastName("Кампуса");
        admin.setRole(UserRole.ADMIN); admin.setActive(true);
        users.save(admin);
    }
}
