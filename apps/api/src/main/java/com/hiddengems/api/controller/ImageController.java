package com.hiddengems.api.controller;

import com.hiddengems.api.dto.image.UploadUrlResponse;
import com.hiddengems.api.service.ImageService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/images")
public class ImageController {

    private final ImageService imageService;

    public ImageController(ImageService imageService) {
        this.imageService = imageService;
    }

    // POST /api/images/upload-url?type=location|review
    @PostMapping("/upload-url")
    public ResponseEntity<UploadUrlResponse> getUploadUrl(
            @RequestParam String type,
            JwtAuthenticationToken auth
    ) {
        UUID userId = UUID.fromString(auth.getName());
        return ResponseEntity.ok(imageService.generateUploadUrl(type, userId));
    }
}
