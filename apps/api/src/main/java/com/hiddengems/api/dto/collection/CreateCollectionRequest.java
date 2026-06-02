package com.hiddengems.api.dto.collection;

import jakarta.validation.constraints.NotBlank;

public record CreateCollectionRequest(
        @NotBlank String title,
        Boolean isPrivate
) {}
