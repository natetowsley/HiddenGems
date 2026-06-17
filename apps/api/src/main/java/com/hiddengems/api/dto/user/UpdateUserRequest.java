package com.hiddengems.api.dto.user;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateUserRequest(

    @NotBlank(message = "Name is required")
    @Size(max = 255)
    String name,

    @NotBlank(message = "Username is required")
    @Size(max = 255)
    String username,

    // nullable, user may clear their avatar
    String avatarUrl
) {}