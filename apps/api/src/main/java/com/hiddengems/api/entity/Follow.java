package com.hiddengems.api.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "follows", schema = "public")
public class Follow {

    @Id
    @GeneratedValue
    @UuidGenerator
    @Column(name = "id", updatable = false, nullable = false, columnDefinition = "uuid")
    private UUID id;

    @Column(name = "follower_id", nullable = false, columnDefinition = "uuid")
    private UUID followerId;

    @Column(name = "following_id", nullable = false, columnDefinition = "uuid")
    private UUID followingId;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // Constructors

    public Follow() {}

    public Follow(UUID followerId, UUID followingId) {
        this.followerId = followerId;
        this.followingId = followingId;
    }

    // Getters

    public UUID getId() { return id; }

    public UUID getFollowerId() { return followerId; }

    public UUID getFollowingId() { return followingId; }

    public LocalDateTime getCreatedAt() { return createdAt; }
}
