package com.hiddengems.api.repository;

import com.hiddengems.api.entity.LocationInvite;
import com.hiddengems.api.entity.LocationInviteId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface LocationInviteRepository extends JpaRepository<LocationInvite, LocationInviteId> {

    boolean existsByLocationIdAndUserId(UUID locationId, UUID userId);

    void deleteByLocationIdAndUserId(UUID locationId, UUID userId);

    List<LocationInvite> findByLocationId(UUID locationId);

    void deleteAllByLocationId(UUID locationId);
}
