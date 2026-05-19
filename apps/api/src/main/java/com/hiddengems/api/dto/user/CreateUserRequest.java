package com.hiddengems.api.dto.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record CreateUserRequest(

    @NotBlank(message = "Name is required")
    String name,

    @NotBlank(message = "Username is required")
    String username,

    @Email(message = "Must be a valid email")
    @NotBlank(message = "Email is required")
    String email,

    // nullable, pulled from OAuth profile if available
    String avatarUrl
) {}