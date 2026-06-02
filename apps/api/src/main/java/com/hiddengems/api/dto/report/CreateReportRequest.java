package com.hiddengems.api.dto.report;

import jakarta.validation.constraints.NotBlank;

public record CreateReportRequest(
        @NotBlank String reason
) {}
