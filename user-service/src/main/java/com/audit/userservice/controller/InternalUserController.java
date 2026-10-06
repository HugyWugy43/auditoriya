package com.audit.userservice.controller;
import com.audit.userservice.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
@RestController
@RequestMapping("/internal/users")
public class InternalUserController {
    private final UserRepository users;
    public InternalUserController(UserRepository users) { this.users = users; }
    public record UserReference(Long id, String role, boolean active) {}
    @GetMapping("/{id}") public ResponseEntity<UserReference> get(@PathVariable Long id) {
        return users.findById(id).map(u -> new UserReference(u.getId(), u.getRole().name(), u.isActive())).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }
}
