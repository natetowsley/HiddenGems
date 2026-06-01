package com.hiddengems.api.controller;

import com.hiddengems.api.dto.collection.AddCollectionItemRequest;
import com.hiddengems.api.dto.collection.CollectionResponse;
import com.hiddengems.api.dto.collection.CreateCollectionRequest;
import com.hiddengems.api.dto.collection.UpdateCollectionRequest;
import com.hiddengems.api.service.CollectionService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/collections")
public class CollectionController {

    private final CollectionService collectionService;

    public CollectionController(CollectionService collectionService) {
        this.collectionService = collectionService;
    }

    // GET /api/collections
    @GetMapping
    public ResponseEntity<List<CollectionResponse>> getMyCollections(JwtAuthenticationToken auth) {
        UUID userId = UUID.fromString(auth.getName());
        return ResponseEntity.ok(collectionService.getByUser(userId));
    }

    // GET /api/collections/{id}
    @GetMapping("/{id}")
    public ResponseEntity<CollectionResponse> getCollection(
            @PathVariable UUID id,
            JwtAuthenticationToken auth
    ) {
        UUID requesterId = UUID.fromString(auth.getName());
        return ResponseEntity.ok(collectionService.getById(id, requesterId));
    }

    // POST /api/collections
    @PostMapping
    public ResponseEntity<CollectionResponse> createCollection(
            @Valid @RequestBody CreateCollectionRequest request,
            JwtAuthenticationToken auth
    ) {
        UUID userId = UUID.fromString(auth.getName());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(collectionService.createCollection(request, userId));
    }

    // PUT /api/collections/{id}
    @PutMapping("/{id}")
    public ResponseEntity<CollectionResponse> updateCollection(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateCollectionRequest request,
            JwtAuthenticationToken auth
    ) {
        UUID requesterId = UUID.fromString(auth.getName());
        return ResponseEntity.ok(collectionService.updateCollection(id, request, requesterId));
    }

    // DELETE /api/collections/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCollection(
            @PathVariable UUID id,
            JwtAuthenticationToken auth
    ) {
        UUID requesterId = UUID.fromString(auth.getName());
        collectionService.deleteCollection(id, requesterId);
        return ResponseEntity.noContent().build();
    }

    // POST /api/collections/{id}/items
    @PostMapping("/{id}/items")
    public ResponseEntity<CollectionResponse> addItem(
            @PathVariable UUID id,
            @Valid @RequestBody AddCollectionItemRequest request,
            JwtAuthenticationToken auth
    ) {
        UUID requesterId = UUID.fromString(auth.getName());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(collectionService.addItem(id, request.locationId(), requesterId));
    }

    // DELETE /api/collections/{id}/items/{locationId}
    @DeleteMapping("/{id}/items/{locationId}")
    public ResponseEntity<Void> removeItem(
            @PathVariable UUID id,
            @PathVariable UUID locationId,
            JwtAuthenticationToken auth
    ) {
        UUID requesterId = UUID.fromString(auth.getName());
        collectionService.removeItem(id, locationId, requesterId);
        return ResponseEntity.noContent().build();
    }
}
