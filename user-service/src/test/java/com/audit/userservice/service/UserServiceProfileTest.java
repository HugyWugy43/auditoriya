package com.audit.userservice.service;

import com.audit.userservice.dto.ProfileUpdateRequest;
import com.audit.userservice.model.User;
import com.audit.userservice.model.UserRole;
import com.audit.userservice.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceProfileTest {
    @Mock private UserRepository users;
    @Mock private org.springframework.security.crypto.password.PasswordEncoder passwords;
    @InjectMocks private UserService service;

    @Test
    void updatesOnlyProfileFieldsAndKeepsLoginAndRole() {
        User user = new User();
        user.setId(7L);
        user.setUsername("student.login");
        user.setEmail("old@example.test");
        user.setPassword("existing-hash");
        user.setFirstName("Old name");
        user.setLastName("Old surname");
        user.setRole(UserRole.STUDENT);
        when(users.findById(7L)).thenReturn(Optional.of(user));
        when(users.existsByEmailIgnoreCase("new@example.test")).thenReturn(false);
        when(users.save(user)).thenReturn(user);

        User updated = service.updateOwnProfile(7L,
                new ProfileUpdateRequest(" New name ", " New surname ", " new@example.test ")).orElseThrow();

        assertEquals("New name", updated.getFirstName());
        assertEquals("New surname", updated.getLastName());
        assertEquals("new@example.test", updated.getEmail());
        assertEquals("student.login", updated.getUsername());
        assertEquals(UserRole.STUDENT, updated.getRole());
        assertEquals("existing-hash", updated.getPassword());
        verify(passwords, never()).encode(anyString());
    }

    @Test
    void rejectsEmailThatBelongsToAnotherAccount() {
        User user = new User();
        user.setId(7L);
        user.setEmail("old@example.test");
        when(users.findById(7L)).thenReturn(Optional.of(user));
        when(users.existsByEmailIgnoreCase("used@example.test")).thenReturn(true);

        IllegalArgumentException error = assertThrows(IllegalArgumentException.class,
                () -> service.updateOwnProfile(7L,
                        new ProfileUpdateRequest("Name", "Surname", "used@example.test")));

        assertEquals("Пользователь с таким email уже существует", error.getMessage());
        verify(users, never()).save(any(User.class));
    }
}
