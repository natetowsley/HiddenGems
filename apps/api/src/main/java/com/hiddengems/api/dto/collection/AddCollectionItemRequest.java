package com.hiddengems.api.dto.collection;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record AddCollectionItemRequest(
        @NotNull UUID locationId
) {}
