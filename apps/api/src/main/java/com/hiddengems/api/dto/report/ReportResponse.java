package com.hiddengems.api.dto.report;

import com.hiddengems.api.entity.Report;

import java.time.LocalDateTime;
import java.util.UUID;

public record ReportResponse(
        UUID id,
        UUID reporterId,
        UUID locationId,
        String reason,
        LocalDateTime createdAt
) {
    public static ReportResponse from(Report report) {
        return new ReportResponse(
                report.getId(),
                report.getReporterId(),
                report.getLocationId(),
                report.getReason(),
                report.getCreatedAt()
        );
    }
}
