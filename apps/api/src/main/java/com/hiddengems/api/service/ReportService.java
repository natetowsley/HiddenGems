package com.hiddengems.api.service;

import com.hiddengems.api.dto.report.CreateReportRequest;
import com.hiddengems.api.dto.report.ReportResponse;
import com.hiddengems.api.entity.Report;
import com.hiddengems.api.repository.LocationRepository;
import com.hiddengems.api.repository.ReportRepository;
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

    public ReportService(ReportRepository reportRepository, LocationRepository locationRepository) {
        this.reportRepository = reportRepository;
        this.locationRepository = locationRepository;
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

        if (location.getCreatedBy() != null && location.getCreatedBy().equals(reporterId)) {
            throw new AccessDeniedException("You cannot report your own location");
        }

        if (reportRepository.existsByReporterIdAndLocationId(reporterId, locationId)) {
            throw new IllegalStateException("You have already reported this location");
        }

        Report report = new Report(reporterId, locationId, request.reason());
        return ReportResponse.from(reportRepository.save(report));
    }

    public void deleteReport(UUID id) {
        if (!reportRepository.existsById(id)) {
            throw new EntityNotFoundException("Report not found: " + id);
        }
        reportRepository.deleteById(id);
    }
}
