package com.hiddengems.api.repository;

import com.hiddengems.api.entity.Report;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ReportRepository extends JpaRepository<Report, UUID> {

    boolean existsByReporterIdAndLocationId(UUID reporterId, UUID locationId);

    void deleteAllByLocationId(UUID locationId);
}
