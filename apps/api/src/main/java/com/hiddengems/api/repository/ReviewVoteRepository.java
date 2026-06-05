package com.hiddengems.api.repository;

import com.hiddengems.api.entity.ReviewVote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ReviewVoteRepository extends JpaRepository<ReviewVote, UUID> {

    Optional<ReviewVote> findByReviewIdAndUserId(UUID reviewId, UUID userId);

    void deleteByReviewIdAndUserId(UUID reviewId, UUID userId);

    void deleteAllByUserId(UUID userId);
}
