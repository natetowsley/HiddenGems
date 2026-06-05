package com.hiddengems.api.service;

import com.hiddengems.api.dto.user.PublicUserResponse;
import com.hiddengems.api.dto.user.UpdateUserRequest;
import com.hiddengems.api.dto.user.UserResponse;
import com.hiddengems.api.entity.User;
import com.hiddengems.api.repository.CollectionItemRepository;
import com.hiddengems.api.repository.CollectionRepository;
import com.hiddengems.api.repository.FollowRepository;
import com.hiddengems.api.repository.LocationInviteRepository;
import com.hiddengems.api.repository.LocationRepository;
import com.hiddengems.api.repository.ReportRepository;
import com.hiddengems.api.repository.ReviewRepository;
import com.hiddengems.api.repository.ReviewVoteRepository;
import com.hiddengems.api.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@Transactional
public class UserService {

    private final UserRepository userRepository;
    private final FollowRepository followRepository;
    private final ReviewVoteRepository reviewVoteRepository;
    private final ReportRepository reportRepository;
    private final LocationInviteRepository locationInviteRepository;
    private final CollectionRepository collectionRepository;
    private final CollectionItemRepository collectionItemRepository;
    private final ReviewRepository reviewRepository;
    private final LocationRepository locationRepository;

    public UserService(
            UserRepository userRepository,
            FollowRepository followRepository,
            ReviewVoteRepository reviewVoteRepository,
            ReportRepository reportRepository,
            LocationInviteRepository locationInviteRepository,
            CollectionRepository collectionRepository,
            CollectionItemRepository collectionItemRepository,
            ReviewRepository reviewRepository,
            LocationRepository locationRepository
    ) {
        this.userRepository = userRepository;
        this.followRepository = followRepository;
        this.reviewVoteRepository = reviewVoteRepository;
        this.reportRepository = reportRepository;
        this.locationInviteRepository = locationInviteRepository;
        this.collectionRepository = collectionRepository;
        this.collectionItemRepository = collectionItemRepository;
        this.reviewRepository = reviewRepository;
        this.locationRepository = locationRepository;
    }

    // Find
    @Transactional(readOnly = true)
    public UserResponse getById(UUID id) {
        return userRepository.findById(id)
                .map(UserResponse::from)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + id));
    }

    @Transactional(readOnly = true)
    public PublicUserResponse getPublicById(UUID id) {
        return userRepository.findById(id)
                .map(PublicUserResponse::from)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + id));
    }

    @Transactional(readOnly = true)
    public UserResponse getByEmail(String email) {
        return userRepository.findByEmail(email)
                .map(UserResponse::from)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + email));
    }

    // Update
    public UserResponse updateUser(UUID id, UpdateUserRequest request, UUID requesterId) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + id));

        checkOwnership(user, requesterId);

        user.setName(request.name());
        user.setAvatarUrl(request.avatarUrl());

        return UserResponse.from(userRepository.save(user));
    }

    // Delete
    public void deleteUser(UUID id, UUID requesterId) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + id));

        checkOwnership(user, requesterId);

        followRepository.deleteAllByFollowerId(id);
        followRepository.deleteAllByFollowingId(id);

        reviewVoteRepository.deleteAllByUserId(id);

        reportRepository.deleteAllByReporterId(id);

        locationInviteRepository.deleteAllByUserId(id);

        collectionRepository.findByUserId(id)
                .forEach(c -> collectionItemRepository.deleteAllByCollectionId(c.getId()));
        collectionRepository.deleteAllByUserId(id);

        reviewRepository.deleteAllByUserId(id);

        locationRepository.findByCreatedBy(id).forEach(location -> {
            UUID locId = location.getId();
            locationInviteRepository.deleteAllByLocationId(locId);
            collectionItemRepository.deleteAllByLocationId(locId);
            reportRepository.deleteAllByLocationId(locId);
            reviewRepository.deleteAllByLocationId(locId);
            locationRepository.deleteById(locId);
        });

        userRepository.deleteById(id);
    }

    // Helpers

    private void checkOwnership(User target, UUID requesterId) {
        if (target.getId().equals(requesterId)) {
            return;
        }
        User requester = userRepository.findById(requesterId)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + requesterId));
        if (requester.getRole() == User.Role.admin) {
            return;
        }
        throw new AccessDeniedException("You do not have permission to modify this account");
    }
}