package com.hiddengems.api.controller;

import com.hiddengems.api.dto.report.CreateReportRequest;
import com.hiddengems.api.dto.report.ReportResponse;
import com.hiddengems.api.service.ReportService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    // GET /api/reports
    @GetMapping("/api/reports")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<ReportResponse>> getAllReports() {
        return ResponseEntity.ok(reportService.getAll());
    }

    // POST /api/locations/{locationId}/reports
    @PostMapping("/api/locations/{locationId}/reports")
    public ResponseEntity<ReportResponse> createReport(
            @PathVariable UUID locationId,
            @Valid @RequestBody CreateReportRequest request,
            JwtAuthenticationToken auth
    ) {
        UUID reporterId = UUID.fromString(auth.getName());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(reportService.createReport(locationId, request, reporterId));
    }

    // DELETE /api/reports/{id}
    @DeleteMapping("/api/reports/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteReport(@PathVariable UUID id) {
        reportService.deleteReport(id);
        return ResponseEntity.noContent().build();
    }
}
