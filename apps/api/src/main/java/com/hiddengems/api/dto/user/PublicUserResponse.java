package com.hiddengems.api.dto.user;

import com.hiddengems.api.entity.User;

import java.time.LocalDateTime;
import java.util.UUID;

public record PublicUserResponse(
        UUID id,
        String name,
        String username,
        String avatarUrl,
        String role,
        LocalDateTime createdAt
) {
    public static PublicUserResponse from(User user) {
        return new PublicUserResponse(
                user.getId(),
                user.getName(),
                user.getUsername(),
                user.getAvatarUrl(),
                user.getRole().name(),
                user.getCreatedAt()
        );
    }
}
