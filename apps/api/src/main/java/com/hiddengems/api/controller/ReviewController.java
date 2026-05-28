package com.hiddengems.api.controller;

import com.hiddengems.api.dto.review.CreateReviewRequest;
import com.hiddengems.api.dto.review.ReviewResponse;
import com.hiddengems.api.dto.review.UpdateReviewRequest;
import com.hiddengems.api.service.ReviewService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/locations/{locationId}/reviews")
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    // GET /api/locations/{locationId}/reviews
    @GetMapping
    public ResponseEntity<List<ReviewResponse>> getReviews(@PathVariable UUID locationId) {
        return ResponseEntity.ok(reviewService.getByLocationId(locationId));
    }

    // POST /api/locations/{locationId}/reviews
    @PostMapping
    public ResponseEntity<ReviewResponse> createReview(
            @PathVariable UUID locationId,
            @Valid @RequestBody CreateReviewRequest request,
            JwtAuthenticationToken auth
    ) {
        UUID userId = UUID.fromString(auth.getName());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(reviewService.createReview(locationId, request, userId));
    }

    // PUT /api/locations/{locationId}/reviews/{id}
    @PutMapping("/{id}")
    public ResponseEntity<ReviewResponse> updateReview(
            @PathVariable UUID locationId,
            @PathVariable UUID id,
            @Valid @RequestBody UpdateReviewRequest request,
            JwtAuthenticationToken auth
    ) {
        UUID requesterId = UUID.fromString(auth.getName());
        return ResponseEntity.ok(reviewService.updateReview(locationId, id, request, requesterId));
    }

    // DELETE /api/locations/{locationId}/reviews/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReview(
            @PathVariable UUID locationId,
            @PathVariable UUID id,
            JwtAuthenticationToken auth
    ) {
        UUID requesterId = UUID.fromString(auth.getName());
        reviewService.deleteReview(locationId, id, requesterId);
        return ResponseEntity.noContent().build();
    }
}
