package com.hiddengems.api.controller;

import com.hiddengems.api.dto.location.CreateLocationRequest;
import com.hiddengems.api.dto.location.LocationResponse;
import com.hiddengems.api.dto.location.UpdateLocationRequest;
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
    public ResponseEntity<LocationResponse> getLocationById(@PathVariable UUID id) {
        return ResponseEntity.ok(locationService.getById(id));
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