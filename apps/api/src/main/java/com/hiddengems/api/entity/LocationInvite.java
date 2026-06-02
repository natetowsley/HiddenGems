package com.hiddengems.api.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "location_invites", schema = "public")
@IdClass(LocationInviteId.class)
public class LocationInvite {

    @Id
    @Column(name = "location_id", columnDefinition = "uuid")
    private UUID locationId;

    @Id
    @Column(name = "user_id", columnDefinition = "uuid")
    private UUID userId;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public LocationInvite() {}

    public LocationInvite(UUID locationId, UUID userId) {
        this.locationId = locationId;
        this.userId = userId;
    }

    public UUID getLocationId() { return locationId; }
    public UUID getUserId() { return userId; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
