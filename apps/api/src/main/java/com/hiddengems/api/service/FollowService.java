package com.hiddengems.api.service;

import com.hiddengems.api.dto.user.UserResponse;
import com.hiddengems.api.entity.Follow;
import com.hiddengems.api.repository.FollowRepository;
import com.hiddengems.api.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class FollowService {

    private final FollowRepository followRepository;
    private final UserRepository userRepository;

    public FollowService(FollowRepository followRepository, UserRepository userRepository) {
        this.followRepository = followRepository;
        this.userRepository = userRepository;
    }

    public void follow(UUID followingId, UUID followerId) {
        if (followerId.equals(followingId)) {
            throw new IllegalArgumentException("You cannot follow yourself");
        }

        if (!userRepository.existsById(followingId)) {
            throw new EntityNotFoundException("User not found: " + followingId);
        }

        if (followRepository.existsByFollowerIdAndFollowingId(followerId, followingId)) {
            throw new IllegalStateException("You are already following this user");
        }

        followRepository.save(new Follow(followerId, followingId));
    }

    public void unfollow(UUID followingId, UUID followerId) {
        if (!followRepository.existsByFollowerIdAndFollowingId(followerId, followingId)) {
            throw new EntityNotFoundException("You are not following this user");
        }

        followRepository.deleteByFollowerIdAndFollowingId(followerId, followingId);
    }

    @Transactional(readOnly = true)
    public List<UserResponse> getFollowers(UUID userId) {
        if (!userRepository.existsById(userId)) {
            throw new EntityNotFoundException("User not found: " + userId);
        }

        return followRepository.findByFollowingId(userId)
                .stream()
                .map(f -> userRepository.findById(f.getFollowerId()))
                .filter(java.util.Optional::isPresent)
                .map(opt -> UserResponse.from(opt.get()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<UserResponse> getFollowing(UUID userId) {
        if (!userRepository.existsById(userId)) {
            throw new EntityNotFoundException("User not found: " + userId);
        }

        return followRepository.findByFollowerId(userId)
                .stream()
                .map(f -> userRepository.findById(f.getFollowingId()))
                .filter(java.util.Optional::isPresent)
                .map(opt -> UserResponse.from(opt.get()))
                .toList();
    }
}
