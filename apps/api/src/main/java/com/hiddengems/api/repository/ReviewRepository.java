package com.hiddengems.api.repository;

import com.hiddengems.api.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ReviewRepository extends JpaRepository<Review, UUID> {

    List<Review> findByLocationId(UUID locationId);

    Optional<Review> findByUserIdAndLocationId(UUID userId, UUID locationId);

    void deleteAllByLocationId(UUID locationId);

    @Modifying(clearAutomatically = true)
    @Query("UPDATE Review r SET r.upvotes = r.upvotes + 1 WHERE r.id = :id")
    void incrementUpvotes(@Param("id") UUID id);

    @Modifying(clearAutomatically = true)
    @Query("UPDATE Review r SET r.upvotes = r.upvotes - 1 WHERE r.id = :id")
    void decrementUpvotes(@Param("id") UUID id);

    @Modifying(clearAutomatically = true)
    @Query("UPDATE Review r SET r.downvotes = r.downvotes + 1 WHERE r.id = :id")
    void incrementDownvotes(@Param("id") UUID id);

    @Modifying(clearAutomatically = true)
    @Query("UPDATE Review r SET r.downvotes = r.downvotes - 1 WHERE r.id = :id")
    void decrementDownvotes(@Param("id") UUID id);
}
