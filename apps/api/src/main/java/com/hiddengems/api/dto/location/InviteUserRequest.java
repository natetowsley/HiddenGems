package com.hiddengems.api.dto.location;

import jakarta.validation.constraints.NotBlank;

public record InviteUserRequest(
        @NotBlank(message = "Username is required")
        String username
) {}
