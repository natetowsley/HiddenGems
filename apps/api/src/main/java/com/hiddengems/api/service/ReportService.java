package com.hiddengems.api.service;

import com.hiddengems.api.dto.report.CreateReportRequest;
import com.hiddengems.api.dto.report.ReportResponse;
import com.hiddengems.api.entity.Location;
import com.hiddengems.api.entity.Report;
import com.hiddengems.api.entity.User;
import com.hiddengems.api.repository.LocationInviteRepository;
import com.hiddengems.api.repository.LocationRepository;
import com.hiddengems.api.repository.ReportRepository;
import com.hiddengems.api.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class ReportService {

    private final ReportRepository reportRepository;
    private final LocationRepository locationRepository;
    private final LocationInviteRepository locationInviteRepository;
    private final UserRepository userRepository;

    public ReportService(ReportRepository reportRepository, LocationRepository locationRepository, LocationInviteRepository locationInviteRepository, UserRepository userRepository) {
        this.reportRepository = reportRepository;
        this.locationRepository = locationRepository;
        this.locationInviteRepository = locationInviteRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<ReportResponse> getAll() {
        return reportRepository.findAll()
                .stream()
                .map(ReportResponse::from)
                .toList();
    }

    public ReportResponse createReport(UUID locationId, CreateReportRequest request, UUID reporterId) {
        var location = locationRepository.findById(locationId)
                .orElseThrow(() -> new EntityNotFoundException("Location not found: " + locationId));

        if (!hasLocationAccess(location, reporterId)) {
            throw new AccessDeniedException("You do not have permission to access this location");
        }

        if (location.getCreatedBy() != null && location.getCreatedBy().equals(reporterId)) {
            throw new AccessDeniedException("You cannot report your own location");
        }

        if (reportRepository.existsByReporterIdAndLocationId(reporterId, locationId)) {
            throw new IllegalStateException("You have already reported this location");
        }

        Report report = new Report(reporterId, locationId, request.reason());
        return ReportResponse.from(reportRepository.save(report));
    }

    private boolean hasLocationAccess(Location location, UUID requesterId) {
        if (!location.isPrivate()) return true;
        if (location.getCreatedBy().equals(requesterId)) return true;
        User user = userRepository.findById(requesterId).orElse(null);
        if (user != null && user.getRole() == User.Role.admin) return true;
        return locationInviteRepository.existsByLocationIdAndUserId(location.getId(), requesterId);
    }

    public void deleteReport(UUID id) {
        if (!reportRepository.existsById(id)) {
            throw new EntityNotFoundException("Report not found: " + id);
        }
        reportRepository.deleteById(id);
    }
}
