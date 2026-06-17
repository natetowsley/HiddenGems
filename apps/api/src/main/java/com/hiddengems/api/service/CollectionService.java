package com.hiddengems.api.service;

import com.hiddengems.api.dto.collection.CollectionResponse;
import com.hiddengems.api.dto.collection.CreateCollectionRequest;
import com.hiddengems.api.dto.collection.UpdateCollectionRequest;
import com.hiddengems.api.entity.Collection;
import com.hiddengems.api.entity.CollectionItem;
import com.hiddengems.api.entity.Location;
import com.hiddengems.api.entity.User;
import com.hiddengems.api.repository.CollectionItemRepository;
import com.hiddengems.api.repository.CollectionRepository;
import com.hiddengems.api.repository.LocationInviteRepository;
import com.hiddengems.api.repository.LocationRepository;
import com.hiddengems.api.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class CollectionService {

    private final CollectionRepository collectionRepository;
    private final CollectionItemRepository collectionItemRepository;
    private final LocationRepository locationRepository;
    private final LocationInviteRepository locationInviteRepository;
    private final UserRepository userRepository;

    public CollectionService(
            CollectionRepository collectionRepository,
            CollectionItemRepository collectionItemRepository,
            LocationRepository locationRepository,
            LocationInviteRepository locationInviteRepository,
            UserRepository userRepository
    ) {
        this.collectionRepository = collectionRepository;
        this.collectionItemRepository = collectionItemRepository;
        this.locationRepository = locationRepository;
        this.locationInviteRepository = locationInviteRepository;
        this.userRepository = userRepository;
    }

    // Fix #2 (requesterId existence) + Fix #1/#2 (location filtering for non-owners)
    @Transactional(readOnly = true)
    public List<CollectionResponse> getPublicByUser(UUID userId, UUID requesterId) {
        if (!userRepository.existsById(userId)) {
            throw new EntityNotFoundException("User not found: " + userId);
        }
        if (!userRepository.existsById(requesterId)) {
            throw new EntityNotFoundException("User not found: " + requesterId);
        }

        boolean isOwner = userId.equals(requesterId);
        boolean isAdmin = !isOwner && userRepository.findById(requesterId)
                .map(u -> u.getRole() == User.Role.admin)
                .orElse(false);
        boolean fullAccess = isOwner || isAdmin;

        List<Collection> collections = collectionRepository.findByUserId(userId);
        List<Collection> visible = collections.stream()
                .filter(c -> !c.isPrivate() || fullAccess)
                .toList();

        if (visible.isEmpty()) return List.of();

        List<UUID> visibleCollectionIds = visible.stream().map(Collection::getId).toList();
        Map<UUID, List<UUID>> itemsByCollection = collectionItemRepository
                .findByCollectionIdIn(visibleCollectionIds)
                .stream()
                .collect(Collectors.groupingBy(
                        CollectionItem::getCollectionId,
                        Collectors.mapping(CollectionItem::getLocationId, Collectors.toList())
                ));

        if (fullAccess) {
            return visible.stream()
                    .map(c -> CollectionResponse.from(c, itemsByCollection.getOrDefault(c.getId(), List.of())))
                    .toList();
        }

        // Non-owner/non-admin: batch-load all referenced locations and filter to only visible ones
        Set<UUID> allLocationIds = itemsByCollection.values().stream()
                .flatMap(List::stream)
                .collect(Collectors.toSet());
        Map<UUID, Location> locationMap = locationRepository.findAllById(allLocationIds).stream()
                .collect(Collectors.toMap(Location::getId, loc -> loc));

        return visible.stream()
                .map(c -> {
                    List<UUID> rawIds = itemsByCollection.getOrDefault(c.getId(), List.of());
                    List<UUID> filteredIds = rawIds.stream()
                            .filter(locId -> {
                                Location loc = locationMap.get(locId);
                                return loc != null && canViewLocation(loc, requesterId, false);
                            })
                            .toList();
                    return CollectionResponse.from(c, filteredIds);
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public List<CollectionResponse> getByUser(UUID userId) {
        List<Collection> collections = collectionRepository.findByUserId(userId);

        List<UUID> collectionIds = collections.stream()
                .map(Collection::getId)
                .toList();

        Map<UUID, List<UUID>> itemsByCollection = collectionItemRepository
                .findByCollectionIdIn(collectionIds)
                .stream()
                .collect(Collectors.groupingBy(
                        CollectionItem::getCollectionId,
                        Collectors.mapping(CollectionItem::getLocationId, Collectors.toList())
                ));

        return collections.stream()
                .map(c -> CollectionResponse.from(c, itemsByCollection.getOrDefault(c.getId(), List.of())))
                .toList();
    }

    // Fix #1/#2: use filtered toResponse so non-owners only see location IDs they can access
    @Transactional(readOnly = true)
    public CollectionResponse getById(UUID id, UUID requesterId) {
        Collection collection = collectionRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Collection not found: " + id));

        if (collection.isPrivate() && !isOwnerOrAdmin(collection, requesterId)) {
            throw new AccessDeniedException("You do not have permission to view this collection");
        }

        return toResponse(collection, requesterId);
    }

    public CollectionResponse createCollection(CreateCollectionRequest request, UUID userId) {
        boolean isPrivate = request.isPrivate() != null && request.isPrivate();
        Collection collection = new Collection(userId, request.title(), isPrivate);
        return toResponse(collectionRepository.save(collection));
    }

    public CollectionResponse updateCollection(UUID id, UpdateCollectionRequest request, UUID requesterId) {
        Collection collection = collectionRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Collection not found: " + id));

        checkOwnership(collection, requesterId);

        collection.setTitle(request.title());
        if (request.isPrivate() != null) {
            collection.setPrivate(request.isPrivate());
        }

        return toResponse(collectionRepository.save(collection));
    }

    public void deleteCollection(UUID id, UUID requesterId) {
        Collection collection = collectionRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Collection not found: " + id));

        checkOwnership(collection, requesterId);

        collectionItemRepository.deleteAllByCollectionId(id);
        collectionRepository.deleteById(id);
    }

    public CollectionResponse addItem(UUID collectionId, UUID locationId, UUID requesterId) {
        Collection collection = collectionRepository.findById(collectionId)
                .orElseThrow(() -> new EntityNotFoundException("Collection not found: " + collectionId));

        checkOwnership(collection, requesterId);

        Location location = locationRepository.findById(locationId)
                .orElseThrow(() -> new EntityNotFoundException("Location not found: " + locationId));

        if (!hasLocationAccess(location, requesterId)) {
            throw new AccessDeniedException("You do not have permission to access this location");
        }

        if (collectionItemRepository.existsByCollectionIdAndLocationId(collectionId, locationId)) {
            throw new IllegalStateException("Location is already in this collection");
        }

        collectionItemRepository.save(new CollectionItem(collectionId, locationId));
        return toResponse(collection);
    }

    public void removeItem(UUID collectionId, UUID locationId, UUID requesterId) {
        Collection collection = collectionRepository.findById(collectionId)
                .orElseThrow(() -> new EntityNotFoundException("Collection not found: " + collectionId));

        checkOwnership(collection, requesterId);

        if (!collectionItemRepository.existsByCollectionIdAndLocationId(collectionId, locationId)) {
            throw new EntityNotFoundException("Location is not in this collection");
        }

        collectionItemRepository.deleteByCollectionIdAndLocationId(collectionId, locationId);
    }

    // Helpers

    // Fix #1: also blocks pending locations for non-creator/non-admin
    private boolean hasLocationAccess(Location location, UUID requesterId) {
        boolean isCreator = location.getCreatedBy().equals(requesterId);
        if (isCreator) return true;
        User requester = userRepository.findById(requesterId).orElse(null);
        boolean isAdmin = requester != null && requester.getRole() == User.Role.admin;
        if (isAdmin) return true;
        if (location.getStatus() == Location.Status.pending) return false;
        if (location.isPrivate()) {
            return locationInviteRepository.existsByLocationIdAndUserId(location.getId(), requesterId);
        }
        return true;
    }

    // Used in batch-filtering paths to avoid repeated user DB lookups
    private boolean canViewLocation(Location location, UUID requesterId, boolean requesterIsAdmin) {
        boolean isCreator = location.getCreatedBy().equals(requesterId);
        if (isCreator || requesterIsAdmin) return true;
        if (location.getStatus() == Location.Status.pending) return false;
        if (location.isPrivate()) {
            return locationInviteRepository.existsByLocationIdAndUserId(location.getId(), requesterId);
        }
        return true;
    }

    // Unfiltered — used for owner's own operations (create, update, addItem)
    private CollectionResponse toResponse(Collection collection) {
        List<UUID> locationIds = collectionItemRepository.findByCollectionId(collection.getId())
                .stream()
                .map(CollectionItem::getLocationId)
                .toList();
        return CollectionResponse.from(collection, locationIds);
    }

    // Filtered — used for read paths that may be viewed by non-owners
    private CollectionResponse toResponse(Collection collection, UUID requesterId) {
        List<UUID> allIds = collectionItemRepository.findByCollectionId(collection.getId())
                .stream().map(CollectionItem::getLocationId).toList();
        if (allIds.isEmpty() || isOwnerOrAdmin(collection, requesterId)) {
            return CollectionResponse.from(collection, allIds);
        }
        List<UUID> visibleIds = locationRepository.findAllById(allIds).stream()
                .filter(loc -> canViewLocation(loc, requesterId, false))
                .map(Location::getId)
                .toList();
        return CollectionResponse.from(collection, visibleIds);
    }

    private void checkOwnership(Collection collection, UUID requesterId) {
        if (collection.getUserId().equals(requesterId)) {
            return;
        }
        User requester = userRepository.findById(requesterId)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + requesterId));
        if (requester.getRole() == User.Role.admin) {
            return;
        }
        throw new AccessDeniedException("You do not have permission to modify this collection");
    }

    private boolean isOwnerOrAdmin(Collection collection, UUID requesterId) {
        if (collection.getUserId().equals(requesterId)) {
            return true;
        }
        return userRepository.findById(requesterId)
                .map(u -> u.getRole() == User.Role.admin)
                .orElse(false);
    }
}
