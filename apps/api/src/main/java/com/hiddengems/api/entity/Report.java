package com.hiddengems.api.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "reports", schema = "public")
public class Report {

    @Id
    @GeneratedValue
    @UuidGenerator
    @Column(name = "id", updatable = false, nullable = false, columnDefinition = "uuid")
    private UUID id;

    @Column(name = "reporter_id", nullable = false, columnDefinition = "uuid")
    private UUID reporterId;

    @Column(name = "location_id", nullable = false, columnDefinition = "uuid")
    private UUID locationId;

    @Column(name = "reason", nullable = false, columnDefinition = "text")
    private String reason;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // Constructors

    public Report() {}

    public Report(UUID reporterId, UUID locationId, String reason) {
        this.reporterId = reporterId;
        this.locationId = locationId;
        this.reason = reason;
    }

    // Getters

    public UUID getId() { return id; }

    public UUID getReporterId() { return reporterId; }

    public UUID getLocationId() { return locationId; }

    public String getReason() { return reason; }

    public LocalDateTime getCreatedAt() { return createdAt; }
}
