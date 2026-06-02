package com.hiddengems.api.service;

import com.hiddengems.api.dto.user.PublicUserResponse;
import com.hiddengems.api.entity.Follow;
import com.hiddengems.api.repository.FollowRepository;
import com.hiddengems.api.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
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
    public List<PublicUserResponse> getFollowers(UUID userId) {
        if (!userRepository.existsById(userId)) {
            throw new EntityNotFoundException("User not found: " + userId);
        }

        List<UUID> followerIds = followRepository.findByFollowingId(userId)
                .stream()
                .map(Follow::getFollowerId)
                .toList();

        return userRepository.findAllById(followerIds)
                .stream()
                .map(PublicUserResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PublicUserResponse> getFollowing(UUID userId) {
        if (!userRepository.existsById(userId)) {
            throw new EntityNotFoundException("User not found: " + userId);
        }

        List<UUID> followingIds = followRepository.findByFollowerId(userId)
                .stream()
                .map(Follow::getFollowingId)
                .toList();

        return userRepository.findAllById(followingIds)
                .stream()
                .map(PublicUserResponse::from)
                .toList();
    }
}
