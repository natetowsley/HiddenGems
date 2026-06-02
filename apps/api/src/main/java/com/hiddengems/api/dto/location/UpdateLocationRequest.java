package com.hiddengems.api.dto.location;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record UpdateLocationRequest(

        @NotBlank(message = "Name is required")
        String name,

        String description,

        @NotNull(message = "Category is required")
        String category,

        List<String> tags,

        Boolean isPrivate
) {}