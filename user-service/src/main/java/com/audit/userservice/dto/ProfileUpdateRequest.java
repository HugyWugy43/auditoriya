package com.audit.userservice.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ProfileUpdateRequest(
        @NotBlank(message = "Имя обязательно")
        @Size(max = 100, message = "Имя должно быть не длиннее 100 символов")
        String firstName,

        @NotBlank(message = "Фамилия обязательна")
        @Size(max = 100, message = "Фамилия должна быть не длиннее 100 символов")
        String lastName,

        @NotBlank(message = "Email обязателен")
        @Email(message = "Некорректный формат email")
        @Size(max = 254, message = "Email слишком длинный")
        String email
) {}
