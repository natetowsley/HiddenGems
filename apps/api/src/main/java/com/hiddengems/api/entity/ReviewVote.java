package com.hiddengems.api.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "review_votes", schema = "public")
public class ReviewVote {

    public enum VoteType { upvote, downvote }

    @Id
    @GeneratedValue
    @UuidGenerator
    @Column(name = "id", updatable = false, nullable = false, columnDefinition = "uuid")
    private UUID id;

    @Column(name = "review_id", nullable = false, columnDefinition = "uuid")
    private UUID reviewId;

    @Column(name = "user_id", nullable = false, columnDefinition = "uuid")
    private UUID userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "vote_type", nullable = false)
    private VoteType voteType;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public ReviewVote() {}

    public ReviewVote(UUID reviewId, UUID userId, VoteType voteType) {
        this.reviewId = reviewId;
        this.userId = userId;
        this.voteType = voteType;
    }

    public UUID getId() { return id; }
    public UUID getReviewId() { return reviewId; }
    public UUID getUserId() { return userId; }
    public VoteType getVoteType() { return voteType; }
    public void setVoteType(VoteType voteType) { this.voteType = voteType; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
