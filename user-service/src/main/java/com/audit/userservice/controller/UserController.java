package com.audit.userservice.controller;
import com.audit.userservice.model.User;
import com.audit.userservice.dto.ProfileUpdateRequest;
import com.audit.userservice.dto.UserView;
import com.audit.userservice.service.UserService;
import com.audit.userservice.repository.UserRepository;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
@RestController
@RequestMapping("/api/users")
public class UserController {
    private final UserService service;
    public UserController(UserService service) { this.service = service; }
    @GetMapping public List<UserView> all() { return service.getAllUsers().stream().map(UserView::of).toList(); }
    @GetMapping("/me") public ResponseEntity<UserView> me(@RequestAttribute Long actorId) { return get(actorId); }
    @PutMapping("/me") public ResponseEntity<UserView> updateMe(@RequestAttribute Long actorId, @Valid @RequestBody ProfileUpdateRequest profile) {
        return service.updateOwnProfile(actorId, profile).map(UserView::of).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }
    @GetMapping("/{id}") public ResponseEntity<UserView> get(@PathVariable Long id) { return service.getUserById(id).map(UserView::of).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build()); }
    @PostMapping public ResponseEntity<UserView> create(@Valid @RequestBody User user) { return ResponseEntity.status(201).body(UserView.of(service.createUser(user))); }
    @PutMapping("/{id}") public ResponseEntity<UserView> update(@PathVariable Long id, @Valid @RequestBody User user) { return service.updateUser(id,user).map(UserView::of).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build()); }
    @DeleteMapping("/{id}") public ResponseEntity<Void> archive(@PathVariable Long id, @RequestAttribute Long actorId) {
        if (id.equals(actorId)) throw new IllegalArgumentException("Нельзя архивировать собственный аккаунт");
        return service.deleteUser(id) ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }
    @ExceptionHandler(IllegalArgumentException.class) public ResponseEntity<?> invalid(IllegalArgumentException e) { return ResponseEntity.badRequest().body(Map.of("message",e.getMessage())); }
}
