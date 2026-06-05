package com.hiddengems.api.service;

import com.hiddengems.api.dto.image.AddImageRequest;
import com.hiddengems.api.dto.review.CastVoteRequest;
import com.hiddengems.api.dto.review.CreateReviewRequest;
import com.hiddengems.api.dto.review.ReviewResponse;
import com.hiddengems.api.dto.review.UpdateReviewRequest;
import com.hiddengems.api.entity.Location;
import com.hiddengems.api.entity.Review;
import com.hiddengems.api.entity.ReviewVote;
import com.hiddengems.api.entity.User;
import com.hiddengems.api.repository.LocationInviteRepository;
import com.hiddengems.api.repository.LocationRepository;
import com.hiddengems.api.repository.ReviewRepository;
import com.hiddengems.api.repository.ReviewVoteRepository;
import com.hiddengems.api.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@Transactional
public class ReviewService {

    private static final int MAX_IMAGES = 3;

    private final ReviewRepository reviewRepository;
    private final LocationRepository locationRepository;
    private final UserRepository userRepository;
    private final ReviewVoteRepository reviewVoteRepository;
    private final LocationInviteRepository locationInviteRepository;
    private final ImageService imageService;

    public ReviewService(ReviewRepository reviewRepository, LocationRepository locationRepository, UserRepository userRepository, ReviewVoteRepository reviewVoteRepository, LocationInviteRepository locationInviteRepository, ImageService imageService) {
        this.reviewRepository = reviewRepository;
        this.locationRepository = locationRepository;
        this.userRepository = userRepository;
        this.reviewVoteRepository = reviewVoteRepository;
        this.locationInviteRepository = locationInviteRepository;
        this.imageService = imageService;
    }

    // Find

    @Transactional(readOnly = true)
    public List<ReviewResponse> getByLocationId(UUID locationId, UUID requesterId) {
        Location location = locationRepository.findById(locationId)
                .orElseThrow(() -> new EntityNotFoundException("Location not found: " + locationId));
        if (!hasLocationAccess(location, requesterId)) {
            throw new AccessDeniedException("You do not have permission to view reviews for this location");
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

        if (!hasLocationAccess(location, userId)) {
            throw new AccessDeniedException("You do not have permission to access this location");
        }

        if (location.getCreatedBy().equals(userId)) {
            throw new AccessDeniedException("You cannot review your own location");
        }

        if (reviewRepository.findByUserIdAndLocationId(userId, locationId).isPresent()) {
            throw new IllegalStateException("You have already reviewed this location");
        }

        List<String> imageUrls = request.imageUrls() != null ? request.imageUrls() : List.of();
        if (imageUrls.size() > MAX_IMAGES) {
            throw new IllegalStateException("Review can have at most " + MAX_IMAGES + " images");
        }

        Review review = new Review(userId, locationId, request.rating());
        review.setText(request.text());
        review.setImageUrls(imageUrls);

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

        List<String> newUrls = request.imageUrls() != null ? request.imageUrls() : List.of();
        if (newUrls.size() > MAX_IMAGES) {
            throw new IllegalStateException("Review can have at most " + MAX_IMAGES + " images");
        }
        for (String url : review.getImageUrls()) {
            if (!newUrls.contains(url)) {
                String objectPath = imageService.extractPath(ImageService.REVIEW_BUCKET, url);
                imageService.deleteFile(ImageService.REVIEW_BUCKET, objectPath);
            }
        }

        review.setRating(request.rating());
        review.setText(request.text());
        review.setImageUrls(newUrls);

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

    // Images

    public ReviewResponse addImage(UUID locationId, UUID reviewId, AddImageRequest request, UUID requesterId) {
        if (!locationRepository.existsById(locationId)) {
            throw new EntityNotFoundException("Location not found: " + locationId);
        }

        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new EntityNotFoundException("Review not found: " + reviewId));

        if (!review.getLocationId().equals(locationId)) {
            throw new EntityNotFoundException("Review not found: " + reviewId);
        }

        checkOwnership(review, requesterId);

        if (review.getImageUrls().size() >= MAX_IMAGES) {
            throw new IllegalStateException("Review has reached the maximum of " + MAX_IMAGES + " images");
        }

        List<String> urls = new java.util.ArrayList<>(review.getImageUrls());
        urls.add(request.url());
        review.setImageUrls(urls);

        return ReviewResponse.from(reviewRepository.save(review));
    }

    public void removeImage(UUID locationId, UUID reviewId, String imageUrl, UUID requesterId) {
        if (!locationRepository.existsById(locationId)) {
            throw new EntityNotFoundException("Location not found: " + locationId);
        }

        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new EntityNotFoundException("Review not found: " + reviewId));

        if (!review.getLocationId().equals(locationId)) {
            throw new EntityNotFoundException("Review not found: " + reviewId);
        }

        checkOwnership(review, requesterId);

        String objectPath = imageService.extractPath(ImageService.REVIEW_BUCKET, imageUrl);
        imageService.deleteFile(ImageService.REVIEW_BUCKET, objectPath);

        List<String> urls = new java.util.ArrayList<>(review.getImageUrls());
        urls.remove(imageUrl);
        review.setImageUrls(urls);

        reviewRepository.save(review);
    }

    // Votes

    public ReviewResponse castVote(UUID locationId, UUID reviewId, CastVoteRequest request, UUID userId) {
        Location location = locationRepository.findById(locationId)
                .orElseThrow(() -> new EntityNotFoundException("Location not found: " + locationId));

        if (!hasLocationAccess(location, userId)) {
            throw new AccessDeniedException("You do not have permission to access this location");
        }

        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new EntityNotFoundException("Review not found: " + reviewId));

        if (!review.getLocationId().equals(locationId)) {
            throw new EntityNotFoundException("Review not found: " + reviewId);
        }

        if (review.getUserId().equals(userId)) {
            throw new AccessDeniedException("You cannot vote on your own review");
        }

        Optional<ReviewVote> existing = reviewVoteRepository.findByReviewIdAndUserId(reviewId, userId);

        if (existing.isPresent()) {
            ReviewVote vote = existing.get();
            if (vote.getVoteType() == request.voteType()) {
                throw new IllegalStateException("You have already voted this way");
            }
            if (vote.getVoteType() == ReviewVote.VoteType.upvote) {
                reviewRepository.decrementUpvotes(reviewId);
                reviewRepository.incrementDownvotes(reviewId);
            } else {
                reviewRepository.decrementDownvotes(reviewId);
                reviewRepository.incrementUpvotes(reviewId);
            }
            vote.setVoteType(request.voteType());
            reviewVoteRepository.save(vote);
        } else {
            if (request.voteType() == ReviewVote.VoteType.upvote) {
                reviewRepository.incrementUpvotes(reviewId);
            } else {
                reviewRepository.incrementDownvotes(reviewId);
            }
            reviewVoteRepository.save(new ReviewVote(reviewId, userId, request.voteType()));
        }

        return ReviewResponse.from(reviewRepository.findById(reviewId).orElseThrow());
    }

    public void removeVote(UUID locationId, UUID reviewId, UUID userId) {
        if (!locationRepository.existsById(locationId)) {
            throw new EntityNotFoundException("Location not found: " + locationId);
        }

        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new EntityNotFoundException("Review not found: " + reviewId));

        if (!review.getLocationId().equals(locationId)) {
            throw new EntityNotFoundException("Review not found: " + reviewId);
        }

        ReviewVote vote = reviewVoteRepository.findByReviewIdAndUserId(reviewId, userId)
                .orElseThrow(() -> new EntityNotFoundException("Vote not found"));

        if (vote.getVoteType() == ReviewVote.VoteType.upvote) {
            reviewRepository.decrementUpvotes(reviewId);
        } else {
            reviewRepository.decrementDownvotes(reviewId);
        }

        reviewVoteRepository.deleteByReviewIdAndUserId(reviewId, userId);
    }

    // Helpers

    private boolean hasLocationAccess(Location location, UUID requesterId) {
        if (!location.isPrivate()) return true;
        if (location.getCreatedBy().equals(requesterId)) return true;
        User user = userRepository.findById(requesterId).orElse(null);
        if (user != null && user.getRole() == User.Role.admin) return true;
        return locationInviteRepository.existsByLocationIdAndUserId(location.getId(), requesterId);
    }

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
