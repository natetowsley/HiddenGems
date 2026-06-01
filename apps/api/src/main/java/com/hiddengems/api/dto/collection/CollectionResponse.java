package com.hiddengems.api.dto.collection;

import com.hiddengems.api.entity.Collection;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record CollectionResponse(
        UUID id,
        UUID userId,
        String title,
        boolean isPrivate,
        List<UUID> locationIds,
        LocalDateTime createdAt
) {
    public static CollectionResponse from(Collection collection, List<UUID> locationIds) {
        return new CollectionResponse(
                collection.getId(),
                collection.getUserId(),
                collection.getTitle(),
                collection.isPrivate(),
                locationIds,
                collection.getCreatedAt()
        );
    }
}
