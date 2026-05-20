package com.hiddengems.api.dto.user;

import com.hiddengems.api.entity.User;
import java.time.LocalDateTime;
import java.util.UUID;

public record UserResponse(
    UUID id,
    String name,
    String email,
    String role,
    String avatarUrl,
    LocalDateTime createdAt
) {
    public static UserResponse from(User user) {
        return new UserResponse(
            user.getId(),
            user.getName(),
            user.getEmail(),
            user.getRole().name(),
            user.getAvatarUrl(),
            user.getCreatedAt()
        );
    }
}