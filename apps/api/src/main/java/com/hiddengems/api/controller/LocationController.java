package com.hiddengems.api.controller;

import com.hiddengems.api.dto.image.AddImageRequest;
import com.hiddengems.api.dto.image.RemoveImageRequest;
import com.hiddengems.api.dto.location.CreateLocationRequest;
import com.hiddengems.api.dto.location.InviteUserRequest;
import com.hiddengems.api.dto.location.LocationResponse;
import com.hiddengems.api.dto.location.UpdateLocationRequest;
import com.hiddengems.api.dto.user.PublicUserResponse;
import com.hiddengems.api.service.LocationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/locations")
public class LocationController {

    private final LocationService locationService;

    public LocationController(LocationService locationService) {
        this.locationService = locationService;
    }

    // GET /api/locations/{id}
    @GetMapping("/{id}")
    public ResponseEntity<LocationResponse> getLocationById(@PathVariable UUID id, JwtAuthenticationToken auth) {
        UUID requesterId = UUID.fromString(auth.getName());
        return ResponseEntity.ok(locationService.getById(id, requesterId));
    }

    // GET /api/locations
    @GetMapping
    public ResponseEntity<List<LocationResponse>> getAllLocations(
            @RequestParam(required = false) String category
    ) {
        if (category != null) {
            return ResponseEntity.ok(locationService.getAllVerifiedByCategory(category));
        }
        return ResponseEntity.ok(locationService.getAllVerified());
    }

    // POST /api/locations
    @PostMapping
    public ResponseEntity<LocationResponse> createLocation(
            @Valid @RequestBody CreateLocationRequest request,
            JwtAuthenticationToken auth
    ) {
        UUID createdBy = UUID.fromString(auth.getName());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(locationService.createLocation(request, createdBy));
    }

    // PUT /api/locations/{id}
    @PutMapping("/{id}")
    public ResponseEntity<LocationResponse> updateLocation(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateLocationRequest request,
            JwtAuthenticationToken auth
    ) {
        UUID requesterId = UUID.fromString(auth.getName());
        return ResponseEntity.ok(locationService.updateLocation(id, request, requesterId));
    }

    // DELETE /api/locations/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLocation(
            @PathVariable UUID id,
            JwtAuthenticationToken auth
    ) {
        UUID requesterId = UUID.fromString(auth.getName());
        locationService.deleteLocation(id, requesterId);
        return ResponseEntity.noContent().build();
    }

    // GET /api/locations/mine
    @GetMapping("/mine")
    public ResponseEntity<List<LocationResponse>> getMyLocations(JwtAuthenticationToken auth) {
        UUID userId = UUID.fromString(auth.getName());
        return ResponseEntity.ok(locationService.getByCreatedBy(userId));
    }

    // GET /api/locations/nearby
    @GetMapping("/nearby")
    public ResponseEntity<List<LocationResponse>> getNearbyLocations(
            @RequestParam double lat,
            @RequestParam double lng,
            @RequestParam(defaultValue = "5.0") double radius,
            JwtAuthenticationToken auth
    ) {
        UUID requesterId = UUID.fromString(auth.getName());
        return ResponseEntity.ok(locationService.getNearby(lat, lng, radius, requesterId));
    }

    // Invites

    // POST /api/locations/{id}/invites
    @PostMapping("/{id}/invites")
    public ResponseEntity<Void> inviteUser(
            @PathVariable UUID id,
            @Valid @RequestBody InviteUserRequest request,
            JwtAuthenticationToken auth
    ) {
        UUID requesterId = UUID.fromString(auth.getName());
        locationService.inviteUser(id, request.username(), requesterId);
        return ResponseEntity.noContent().build();
    }

    // DELETE /api/locations/{id}/invites/{inviteeId}
    @DeleteMapping("/{id}/invites/{inviteeId}")
    public ResponseEntity<Void> removeInvite(
            @PathVariable UUID id,
            @PathVariable UUID inviteeId,
            JwtAuthenticationToken auth
    ) {
        UUID requesterId = UUID.fromString(auth.getName());
        locationService.removeInvite(id, inviteeId, requesterId);
        return ResponseEntity.noContent().build();
    }

    // GET /api/locations/{id}/invites
    @GetMapping("/{id}/invites")
    public ResponseEntity<List<PublicUserResponse>> getInvites(
            @PathVariable UUID id,
            JwtAuthenticationToken auth
    ) {
        UUID requesterId = UUID.fromString(auth.getName());
        return ResponseEntity.ok(locationService.getInvites(id, requesterId));
    }

    // Images

    // POST /api/locations/{id}/images
    @PostMapping("/{id}/images")
    public ResponseEntity<LocationResponse> addImage(
            @PathVariable UUID id,
            @Valid @RequestBody AddImageRequest request,
            JwtAuthenticationToken auth
    ) {
        UUID requesterId = UUID.fromString(auth.getName());
        return ResponseEntity.ok(locationService.addImage(id, request, requesterId));
    }

    // DELETE /api/locations/{id}/images
    @DeleteMapping("/{id}/images")
    public ResponseEntity<Void> removeImage(
            @PathVariable UUID id,
            @Valid @RequestBody RemoveImageRequest request,
            JwtAuthenticationToken auth
    ) {
        UUID requesterId = UUID.fromString(auth.getName());
        locationService.removeImage(id, request.url(), requesterId);
        return ResponseEntity.noContent().build();
    }

    // Admin

    // GET /api/locations/pending
    @GetMapping("/pending")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<LocationResponse>> getPendingLocations() {
        return ResponseEntity.ok(locationService.getPending());
    }

    // PATCH /api/locations/{id}/verify
    @PatchMapping("/{id}/verify")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<LocationResponse> verifyLocation(@PathVariable UUID id) {
        return ResponseEntity.ok(locationService.verifyLocation(id));
    }

    // PATCH /api/locations/{id}/archive
    @PatchMapping("/{id}/archive")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<LocationResponse> archiveLocation(@PathVariable UUID id) {
        return ResponseEntity.ok(locationService.archiveLocation(id));
    }
}
