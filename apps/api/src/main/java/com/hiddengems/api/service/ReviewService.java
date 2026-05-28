package com.hiddengems.api.service;

import com.hiddengems.api.dto.review.CreateReviewRequest;
import com.hiddengems.api.dto.review.ReviewResponse;
import com.hiddengems.api.dto.review.UpdateReviewRequest;
import com.hiddengems.api.entity.Review;
import com.hiddengems.api.entity.User;
import com.hiddengems.api.repository.LocationRepository;
import com.hiddengems.api.repository.ReviewRepository;
import com.hiddengems.api.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final LocationRepository locationRepository;
    private final UserRepository userRepository;

    public ReviewService(ReviewRepository reviewRepository, LocationRepository locationRepository, UserRepository userRepository) {
        this.reviewRepository = reviewRepository;
        this.locationRepository = locationRepository;
        this.userRepository = userRepository;
    }

    // Find

    @Transactional(readOnly = true)
    public List<ReviewResponse> getByLocationId(UUID locationId) {
        if (!locationRepository.existsById(locationId)) {
            throw new EntityNotFoundException("Location not found: " + locationId);
        }
        return reviewRepository.findByLocationId(locationId)
                .stream()
                .map(ReviewResponse::from)
                .toList();
    }

    // Create

    public ReviewResponse createReview(UUID locationId, CreateReviewRequest request, UUID userId) {
        var location = locationRepository.findById(locationId)
                .orElseThrow(() -> new EntityNotFoundException("Location not found: " + locationId));

        if (location.getCreatedBy().equals(userId)) {
            throw new AccessDeniedException("You cannot review your own location");
        }

        if (reviewRepository.findByUserIdAndLocationId(userId, locationId).isPresent()) {
            throw new IllegalStateException("You have already reviewed this location");
        }

        Review review = new Review(userId, locationId, request.rating());
        review.setText(request.text());
        review.setImageUrls(request.imageUrls() != null ? request.imageUrls() : List.of());

        Review saved = reviewRepository.save(review);
        locationRepository.recalculateAvgRating(locationId);

        return ReviewResponse.from(saved);
    }

    // Update

    public ReviewResponse updateReview(UUID locationId, UUID reviewId, UpdateReviewRequest request, UUID requesterId) {
        if (!locationRepository.existsById(locationId)) {
            throw new EntityNotFoundException("Location not found: " + locationId);
        }

        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new EntityNotFoundException("Review not found: " + reviewId));

        if (!review.getLocationId().equals(locationId)) {
            throw new EntityNotFoundException("Review not found: " + reviewId);
        }

        checkOwnership(review, requesterId);

        review.setRating(request.rating());
        review.setText(request.text());
        review.setImageUrls(request.imageUrls() != null ? request.imageUrls() : List.of());

        Review saved = reviewRepository.save(review);
        locationRepository.recalculateAvgRating(locationId);

        return ReviewResponse.from(saved);
    }

    // Delete

    public void deleteReview(UUID locationId, UUID reviewId, UUID requesterId) {
        if (!locationRepository.existsById(locationId)) {
            throw new EntityNotFoundException("Location not found: " + locationId);
        }

        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new EntityNotFoundException("Review not found: " + reviewId));

        if (!review.getLocationId().equals(locationId)) {
            throw new EntityNotFoundException("Review not found: " + reviewId);
        }

        checkOwnership(review, requesterId);

        reviewRepository.deleteById(reviewId);
        locationRepository.recalculateAvgRating(locationId);
    }

    // Helpers

    private void checkOwnership(Review review, UUID requesterId) {
        if (review.getUserId().equals(requesterId)) {
            return;
        }

        User requester = userRepository.findById(requesterId)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + requesterId));

        if (requester.getRole() == User.Role.admin) {
            return;
        }

        throw new AccessDeniedException("You do not have permission to modify this review");
    }
}
