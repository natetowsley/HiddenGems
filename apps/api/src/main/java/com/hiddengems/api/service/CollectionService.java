package com.hiddengems.api.service;

import com.hiddengems.api.dto.collection.CollectionResponse;
import com.hiddengems.api.dto.collection.CreateCollectionRequest;
import com.hiddengems.api.dto.collection.UpdateCollectionRequest;
import com.hiddengems.api.entity.Collection;
import com.hiddengems.api.entity.CollectionItem;
import com.hiddengems.api.entity.User;
import com.hiddengems.api.repository.CollectionItemRepository;
import com.hiddengems.api.repository.CollectionRepository;
import com.hiddengems.api.repository.LocationRepository;
import com.hiddengems.api.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class CollectionService {

    private final CollectionRepository collectionRepository;
    private final CollectionItemRepository collectionItemRepository;
    private final LocationRepository locationRepository;
    private final UserRepository userRepository;

    public CollectionService(
            CollectionRepository collectionRepository,
            CollectionItemRepository collectionItemRepository,
            LocationRepository locationRepository,
            UserRepository userRepository
    ) {
        this.collectionRepository = collectionRepository;
        this.collectionItemRepository = collectionItemRepository;
        this.locationRepository = locationRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<CollectionResponse> getByUser(UUID userId) {
        return collectionRepository.findByUserId(userId)
                .stream()
                .map(c -> toResponse(c))
                .toList();
    }

    @Transactional(readOnly = true)
    public CollectionResponse getById(UUID id, UUID requesterId) {
        Collection collection = collectionRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Collection not found: " + id));

        if (collection.isPrivate() && !isOwnerOrAdmin(collection, requesterId)) {
            throw new AccessDeniedException("You do not have permission to view this collection");
        }

        return toResponse(collection);
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
        collection.setPrivate(request.isPrivate() != null && request.isPrivate());

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

        if (!locationRepository.existsById(locationId)) {
            throw new EntityNotFoundException("Location not found: " + locationId);
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

    private CollectionResponse toResponse(Collection collection) {
        List<UUID> locationIds = collectionItemRepository.findByCollectionId(collection.getId())
                .stream()
                .map(CollectionItem::getLocationId)
                .toList();
        return CollectionResponse.from(collection, locationIds);
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
