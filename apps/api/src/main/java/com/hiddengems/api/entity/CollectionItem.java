package com.hiddengems.api.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.UuidGenerator;

import java.util.UUID;

@Entity
@Table(name = "collection_items", schema = "public")
public class CollectionItem {

    @Id
    @GeneratedValue
    @UuidGenerator
    @Column(name = "id", updatable = false, nullable = false, columnDefinition = "uuid")
    private UUID id;

    @Column(name = "collection_id", nullable = false, columnDefinition = "uuid")
    private UUID collectionId;

    @Column(name = "location_id", nullable = false, columnDefinition = "uuid")
    private UUID locationId;

    // Constructors

    public CollectionItem() {}

    public CollectionItem(UUID collectionId, UUID locationId) {
        this.collectionId = collectionId;
        this.locationId = locationId;
    }

    // Getters

    public UUID getId() { return id; }

    public UUID getCollectionId() { return collectionId; }

    public UUID getLocationId() { return locationId; }
}
