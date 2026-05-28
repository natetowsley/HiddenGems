package com.hiddengems.api.repository;

import com.hiddengems.api.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ReviewRepository extends JpaRepository<Review, UUID> {

    List<Review> findByLocationId(UUID locationId);

    Optional<Review> findByUserIdAndLocationId(UUID userId, UUID locationId);

    void deleteAllByLocationId(UUID locationId);
}
