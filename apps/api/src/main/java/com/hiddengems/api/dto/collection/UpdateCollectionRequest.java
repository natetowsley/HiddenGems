package com.hiddengems.api.dto.collection;

import jakarta.validation.constraints.NotBlank;

public record UpdateCollectionRequest(
        @NotBlank String title,
        Boolean isPrivate
) {}
