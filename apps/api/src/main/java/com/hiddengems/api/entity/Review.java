package com.hiddengems.api.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "reviews", schema = "public")
public class Review {

    @Id
    @GeneratedValue
    @UuidGenerator
    @Column(name = "id", updatable = false, nullable = false, columnDefinition = "uuid")
    private UUID id;

    @Column(name = "user_id", nullable = false, columnDefinition = "uuid")
    private UUID userId;

    @Column(name = "location_id", nullable = false, columnDefinition = "uuid")
    private UUID locationId;

    @Column(name = "rating", nullable = false)
    private Integer rating;

    @Column(name = "text", columnDefinition = "text")
    private String text;

    @Column(name = "upvotes", nullable = false)
    private Integer upvotes = 0;

    @Column(name = "downvotes", nullable = false)
    private Integer downvotes = 0;

    @Column(name = "image_urls", columnDefinition = "text[]")
    private List<String> imageUrls = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // Constructors

    public Review() {}

    public Review(UUID userId, UUID locationId, Integer rating) {
        this.userId = userId;
        this.locationId = locationId;
        this.rating = rating;
    }

    // Getters & Setters

    public UUID getId() { return id; }

    public UUID getUserId() { return userId; }

    public UUID getLocationId() { return locationId; }

    public Integer getRating() { return rating; }
    public void setRating(Integer rating) { this.rating = rating; }

    public String getText() { return text; }
    public void setText(String text) { this.text = text; }

    public Integer getUpvotes() { return upvotes; }

    public Integer getDownvotes() { return downvotes; }

    public List<String> getImageUrls() { return imageUrls; }
    public void setImageUrls(List<String> imageUrls) { this.imageUrls = imageUrls; }

    public LocalDateTime getCreatedAt() { return createdAt; }
}
