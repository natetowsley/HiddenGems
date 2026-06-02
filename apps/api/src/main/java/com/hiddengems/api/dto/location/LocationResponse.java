package com.hiddengems.api.dto.location;

import com.hiddengems.api.entity.Location;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record LocationResponse(
        UUID id,
        String name,
        String description,
        String category,
        List<String> tags,
        Double lat,
        Double lng,
        UUID createdBy,
        String status,
        boolean isPrivate,
        BigDecimal avgRating,
        List<String> imageUrls,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static LocationResponse from(Location location) {
        return new LocationResponse(
                location.getId(),
                location.getName(),
                location.getDescription(),
                location.getCategory().name(),
                location.getTags(),
                location.getLat(),
                location.getLng(),
                location.getCreatedBy(),
                location.getStatus().name(),
                location.isPrivate(),
                location.getAvgRating(),
                location.getImageUrls(),
                location.getCreatedAt(),
                location.getUpdatedAt()
        );
    }
}