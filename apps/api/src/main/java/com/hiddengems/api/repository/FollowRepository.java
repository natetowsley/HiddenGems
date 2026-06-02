package com.hiddengems.api.repository;

import com.hiddengems.api.entity.Follow;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface FollowRepository extends JpaRepository<Follow, UUID> {

    boolean existsByFollowerIdAndFollowingId(UUID followerId, UUID followingId);

    List<Follow> findByFollowingId(UUID followingId);

    List<Follow> findByFollowerId(UUID followerId);

    void deleteByFollowerIdAndFollowingId(UUID followerId, UUID followingId);
}
