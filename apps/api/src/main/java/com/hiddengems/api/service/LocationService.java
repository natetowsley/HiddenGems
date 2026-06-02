package com.hiddengems.api.service;

import com.hiddengems.api.dto.image.AddImageRequest;
import com.hiddengems.api.dto.location.CreateLocationRequest;
import com.hiddengems.api.dto.location.LocationResponse;
import com.hiddengems.api.dto.location.UpdateLocationRequest;
import com.hiddengems.api.entity.Location;
import com.hiddengems.api.entity.User;
import com.hiddengems.api.repository.CollectionItemRepository;
import com.hiddengems.api.repository.LocationRepository;
import com.hiddengems.api.repository.ReportRepository;
import com.hiddengems.api.repository.ReviewRepository;
import com.hiddengems.api.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class LocationService {

    private static final int MAX_IMAGES = 10;

    private final LocationRepository locationRepository;
    private final UserRepository userRepository;
    private final ReviewRepository reviewRepository;
    private final CollectionItemRepository collectionItemRepository;
    private final ReportRepository reportRepository;
    private final ImageService imageService;

    public LocationService(LocationRepository locationRepository, UserRepository userRepository, ReviewRepository reviewRepository, CollectionItemRepository collectionItemRepository, ReportRepository reportRepository, ImageService imageService) {
        this.locationRepository = locationRepository;
        this.userRepository = userRepository;
        this.reviewRepository = reviewRepository;
        this.collectionItemRepository = collectionItemRepository;
        this.reportRepository = reportRepository;
        this.imageService = imageService;
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

    @Transactional(readOnly = true)
    public List<LocationResponse> getByCreatedBy(UUID userId) {
        return locationRepository.findByCreatedBy(userId)
                .stream()
                .map(LocationResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<LocationResponse> getNearby(double lat, double lng, double radiusKm) {
        if (lat < -90 || lat > 90) {
            throw new IllegalArgumentException("Latitude must be between -90 and 90");
        }
        if (lng < -180 || lng > 180) {
            throw new IllegalArgumentException("Longitude must be between -180 and 180");
        }
        if (radiusKm <= 0 || radiusKm > 50) {
            throw new IllegalArgumentException("Radius must be between 0 and 50 km");
        }

        double radiusMeters = radiusKm * 1000;
        return locationRepository.findNearbyVerified(lat, lng, radiusMeters)
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
                createdBy);

        location.setDescription(request.description());
        location.setTags(request.tags() != null ? request.tags() : List.of());
        location.setImageUrls(request.imageUrls() != null ? request.imageUrls() : List.of());

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

        collectionItemRepository.deleteAllByLocationId(id);
        reportRepository.deleteAllByLocationId(id);
        reviewRepository.deleteAllByLocationId(id);
        locationRepository.deleteById(id);
    }

    // Moderation
    public LocationResponse verifyLocation(UUID id) {
        Location location = locationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Location not found: " + id));

        if (location.getStatus() == Location.Status.verified) {
            throw new IllegalStateException("Location is already verified");
        }

        location.setStatus(Location.Status.verified);
        return LocationResponse.from(locationRepository.save(location));
    }

    public LocationResponse archiveLocation(UUID id) {
        Location location = locationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Location not found: " + id));

        if (location.getStatus() == Location.Status.archived) {
            throw new IllegalStateException("Location is already archived");
        }

        location.setStatus(Location.Status.archived);
        return LocationResponse.from(locationRepository.save(location));
    }

    // Images

    public LocationResponse addImage(UUID locationId, AddImageRequest request, UUID requesterId) {
        Location location = locationRepository.findById(locationId)
                .orElseThrow(() -> new EntityNotFoundException("Location not found: " + locationId));

        checkOwnership(location, requesterId);

        if (location.getImageUrls().size() >= MAX_IMAGES) {
            throw new IllegalStateException("Location has reached the maximum of " + MAX_IMAGES + " images");
        }

        List<String> urls = new java.util.ArrayList<>(location.getImageUrls());
        urls.add(request.url());
        location.setImageUrls(urls);

        return LocationResponse.from(locationRepository.save(location));
    }

    public void removeImage(UUID locationId, String imageUrl, UUID requesterId) {
        Location location = locationRepository.findById(locationId)
                .orElseThrow(() -> new EntityNotFoundException("Location not found: " + locationId));

        checkOwnership(location, requesterId);

        String objectPath = imageService.extractPath(ImageService.LOCATION_BUCKET, imageUrl);
        imageService.deleteFile(ImageService.LOCATION_BUCKET, objectPath);

        List<String> urls = new java.util.ArrayList<>(location.getImageUrls());
        urls.remove(imageUrl);
        location.setImageUrls(urls);

        locationRepository.save(location);
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
        if (location.getCreatedBy().equals(requesterId)) {
            return;
        }

        User requester = userRepository.findById(requesterId)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + requesterId));

        if (requester.getRole() == User.Role.admin) {
            return;
        }

        throw new AccessDeniedException("You do not have permission to modify this location");
    }
}