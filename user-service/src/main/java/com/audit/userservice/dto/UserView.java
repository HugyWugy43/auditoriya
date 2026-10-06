package com.audit.userservice.dto;
import com.audit.userservice.model.User;
import com.audit.userservice.model.UserRole;
public record UserView(Long id, String username, String email, String firstName, String lastName, UserRole role, boolean active) {
    public static UserView of(User u) { return new UserView(u.getId(), u.getUsername(), u.getEmail(), u.getFirstName(), u.getLastName(), u.getRole(), u.isActive()); }
}
