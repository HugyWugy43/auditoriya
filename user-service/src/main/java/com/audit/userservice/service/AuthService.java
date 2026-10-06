package com.audit.userservice.service;

import com.audit.userservice.dto.AuthResponse;
import com.audit.userservice.dto.RegisterRequest;
import com.audit.userservice.model.User;
import com.audit.userservice.model.UserRole;
import com.audit.userservice.repository.UserRepository;
import com.audit.userservice.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@Transactional
public class AuthService {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Autowired
    private JwtUtil jwtUtil;
    
    public AuthResponse login(String username, String password) {
        Optional<User> userOpt = userRepository.findByUsername(username);
        
        if (userOpt.isEmpty() || !userOpt.get().isActive()) {
            throw new IllegalArgumentException("Неверное имя пользователя или пароль");
        }
        
        User user = userOpt.get();
        
        if (!user.isActive() || !passwordEncoder.matches(password, user.getPassword())) {
            throw new IllegalArgumentException("Неверное имя пользователя или пароль");
        }
        
        // Генерируем JWT токен
        String token = jwtUtil.generateToken(user.getUsername(), user.getRole().name(), user.getId());
        
        // Создаем ответ
        AuthResponse response = new AuthResponse();
        response.setToken(token);
        response.setId(user.getId());
        response.setUsername(user.getUsername());
        response.setEmail(user.getEmail());
        response.setFirstName(user.getFirstName());
        response.setLastName(user.getLastName());
        response.setRole(user.getRole().name());
        
        return response;
    }
    
    public User validateToken(String token) {
        try {
            String username = jwtUtil.extractUsername(token);
            
            if (!jwtUtil.validateToken(token, username)) {
                throw new IllegalArgumentException("Недействительный токен");
            }
            
            Optional<User> userOpt = userRepository.findByUsername(username);
            if (userOpt.isEmpty() || !userOpt.get().isActive()) {
                throw new IllegalArgumentException("Пользователь не найден");
            }
            
            return userOpt.get();
        } catch (io.jsonwebtoken.JwtException | IllegalArgumentException e) {
            throw new IllegalArgumentException("Недействительный токен");
        }
    }
    
    public AuthResponse register(RegisterRequest registerRequest) {
        // Проверяем, существует ли пользователь с таким username
        if (userRepository.existsByUsername(registerRequest.getUsername())) {
            throw new IllegalArgumentException("Пользователь с таким именем уже существует");
        }
        
        // Проверяем, существует ли пользователь с таким email
        if (userRepository.existsByEmail(registerRequest.getEmail())) {
            throw new IllegalArgumentException("Пользователь с таким email уже существует");
        }
        
        // Создаем нового пользователя
        User user = new User();
        user.setUsername(registerRequest.getUsername());
        user.setEmail(registerRequest.getEmail());
        user.setPassword(passwordEncoder.encode(registerRequest.getPassword()));
        user.setFirstName(registerRequest.getFirstName());
        user.setLastName(registerRequest.getLastName());
        user.setRole(UserRole.STUDENT); // По умолчанию регистрируем как студента
        
        // Сохраняем пользователя
        User savedUser = userRepository.save(user);
        
        // Генерируем JWT токен
        String token = jwtUtil.generateToken(savedUser.getUsername(), savedUser.getRole().name(), savedUser.getId());
        
        // Создаем ответ
        AuthResponse response = new AuthResponse();
        response.setToken(token);
        response.setId(savedUser.getId());
        response.setUsername(savedUser.getUsername());
        response.setEmail(savedUser.getEmail());
        response.setFirstName(savedUser.getFirstName());
        response.setLastName(savedUser.getLastName());
        response.setRole(savedUser.getRole().name());
        
        return response;
    }
}

