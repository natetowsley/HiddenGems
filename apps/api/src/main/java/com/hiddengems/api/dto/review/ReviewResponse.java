package com.hiddengems.api.dto.review;

import com.hiddengems.api.entity.Review;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record ReviewResponse(
        UUID id,
        UUID userId,
        UUID locationId,
        Integer rating,
        String text,
        Integer upvotes,
        Integer downvotes,
        List<String> imageUrls,
        LocalDateTime createdAt
) {
    public static ReviewResponse from(Review review) {
        return new ReviewResponse(
                review.getId(),
                review.getUserId(),
                review.getLocationId(),
                review.getRating(),
                review.getText(),
                review.getUpvotes(),
                review.getDownvotes(),
                review.getImageUrls(),
                review.getCreatedAt()
        );
    }
}
