package com.hiddengems.api.repository;

import com.hiddengems.api.entity.Location;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface LocationRepository extends JpaRepository<Location, UUID> {

    List<Location> findByStatus(Location.Status status);

    List<Location> findByStatusAndCategory(Location.Status status, Location.Category category);

    List<Location> findByCreatedBy(UUID createdBy);

    @Query(
        value = """
            SELECT * FROM public.locations
            WHERE status = 'verified'
            AND ST_DWithin(coords, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography, :radiusMeters)
            ORDER BY ST_Distance(coords, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography)
            """,
        nativeQuery = true
    )
    List<Location> findNearbyVerified(@Param("lat") double lat, @Param("lng") double lng, @Param("radiusMeters") double radiusMeters);

    @Modifying
    @Query("UPDATE Location l SET l.avgRating = COALESCE((SELECT AVG(r.rating) FROM Review r WHERE r.locationId = :locationId), 0) WHERE l.id = :locationId")
    void recalculateAvgRating(@Param("locationId") UUID locationId);
}