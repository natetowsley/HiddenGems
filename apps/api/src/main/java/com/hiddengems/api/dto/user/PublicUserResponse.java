package com.hiddengems.api.dto.user;

import com.hiddengems.api.entity.User;

import java.util.UUID;

public record PublicUserResponse(
        UUID id,
        String name,
        String username,
        String avatarUrl
) {
    public static PublicUserResponse from(User user) {
        return new PublicUserResponse(
                user.getId(),
                user.getName(),
                user.getUsername(),
                user.getAvatarUrl()
        );
    }
}
