package com.hiddengems.api.dto.image;

import jakarta.validation.constraints.NotBlank;

public record AddImageRequest(
        @NotBlank(message = "URL is required")
        String url
) {}
