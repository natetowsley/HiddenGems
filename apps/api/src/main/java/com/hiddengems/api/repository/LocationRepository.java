package com.hiddengems.api.repository;

import com.hiddengems.api.entity.Location;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface LocationRepository extends JpaRepository<Location, UUID> {

    List<Location> findByStatus(Location.Status status);

    List<Location> findByStatusAndCategory(Location.Status status, Location.Category category);

    List<Location> findByCreatedBy(UUID createdBy);

}