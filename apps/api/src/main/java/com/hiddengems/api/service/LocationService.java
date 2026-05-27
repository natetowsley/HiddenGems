package com.hiddengems.api.service;

import com.hiddengems.api.dto.location.CreateLocationRequest;
import com.hiddengems.api.dto.location.LocationResponse;
import com.hiddengems.api.dto.location.UpdateLocationRequest;
import com.hiddengems.api.entity.Location;
import com.hiddengems.api.repository.LocationRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class LocationService {

    private final LocationRepository locationRepository;

    public LocationService(LocationRepository locationRepository) {
        this.locationRepository = locationRepository;
    }

    // Find
    @Transactional(readOnly = true)
    public LocationResponse getById(UUID id) {
        return locationRepository.findById(id)
                .map(LocationResponse::from)
                .orElseThrow(() -> new EntityNotFoundException("Location not found: " + id));
    }

    @Transactional(readOnly = true)
    public List<LocationResponse> getAllVerified() {
        return locationRepository.findByStatus(Location.Status.verified)
                .stream()
                .map(LocationResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<LocationResponse> getAllVerifiedByCategory(String category) {
        Location.Category parsedCategory = parseCategory(category);
        return locationRepository.findByStatusAndCategory(Location.Status.verified, parsedCategory)
                .stream()
                .map(LocationResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<LocationResponse> getPending() {
        return locationRepository.findByStatus(Location.Status.pending)
                .stream()
                .map(LocationResponse::from)
                .toList();
    }

    // Create
    public LocationResponse createLocation(CreateLocationRequest request, UUID createdBy) {
        Location.Category category = parseCategory(request.category());

        Location location = new Location(
                request.name(),
                category,
                request.lat(),
                request.lng(),
                createdBy
        );

        location.setDescription(request.description());
        location.setTags(request.tags() != null ? request.tags() : List.of());

        Location saved = locationRepository.save(location);
        locationRepository.flush();
        return LocationResponse.from(locationRepository.findById(saved.getId()).orElseThrow());
    }

    // Update
    public LocationResponse updateLocation(UUID id, UpdateLocationRequest request, UUID requesterId) {
        Location location = locationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Location not found: " + id));

        checkOwnership(location, requesterId);

        location.setName(request.name());
        location.setDescription(request.description());
        location.setCategory(parseCategory(request.category()));
        location.setTags(request.tags() != null ? request.tags() : List.of());

        return LocationResponse.from(locationRepository.save(location));
    }

    // Delete
    public void deleteLocation(UUID id, UUID requesterId) {
        Location location = locationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Location not found: " + id));

        checkOwnership(location, requesterId);

        locationRepository.deleteById(id);
    }

    // Moderation
    public LocationResponse verifyLocation(UUID id) {
        Location location = locationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Location not found: " + id));

        if (location.getStatus() == Location.Status.archived) {
            throw new IllegalStateException("Cannot verify an archived location");
        }

        location.setStatus(Location.Status.verified);
        return LocationResponse.from(locationRepository.save(location));
    }

    public LocationResponse archiveLocation(UUID id) {
        Location location = locationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Location not found: " + id));

        if (location.getStatus() == Location.Status.verified) {
            throw new IllegalStateException("Cannot archive a verified location");
        }

        location.setStatus(Location.Status.archived);
        return LocationResponse.from(locationRepository.save(location));
    }

    // Helpers
    private Location.Category parseCategory(String category) {
        try {
            return Location.Category.valueOf(category);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid category: " + category);
        }
    }

    private void checkOwnership(Location location, UUID requesterId) {
        if (!location.getCreatedBy().equals(requesterId)) {
            throw new AccessDeniedException("You do not have permission to modify this location");
        }
    }
}