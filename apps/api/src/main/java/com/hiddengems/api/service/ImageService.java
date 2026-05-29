package com.hiddengems.api.service;

import com.hiddengems.api.dto.image.UploadUrlResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.UUID;

@Service
public class ImageService {

    public static final String LOCATION_BUCKET = "location-images";
    public static final String REVIEW_BUCKET = "review-images";

    private final String supabaseUrl;
    private final RestClient restClient;

    public ImageService(
            @Value("${supabase.url}") String supabaseUrl,
            @Value("${supabase.service-role-key}") String serviceRoleKey
    ) {
        this.supabaseUrl = supabaseUrl;
        this.restClient = RestClient.builder()
                .baseUrl(supabaseUrl + "/storage/v1")
                .defaultHeader("Authorization", "Bearer " + serviceRoleKey)
                .build();
    }

    public UploadUrlResponse generateUploadUrl(String type, UUID userId) {
        String bucket = switch (type) {
            case "location" -> LOCATION_BUCKET;
            case "review" -> REVIEW_BUCKET;
            default -> throw new IllegalArgumentException("Invalid type: " + type + ". Must be 'location' or 'review'");
        };
        String objectPath = userId + "/" + UUID.randomUUID();
        return generateSignedUploadUrl(bucket, objectPath);
    }

    public void deleteFile(String bucket, String objectPath) {
        restClient.delete()
                .uri("/object/{bucket}/{path}", bucket, objectPath)
                .retrieve()
                .toBodilessEntity();
    }

    public String getPublicUrl(String bucket, String objectPath) {
        return supabaseUrl + "/storage/v1/object/public/" + bucket + "/" + objectPath;
    }

    public String extractPath(String bucket, String publicUrl) {
        String prefix = supabaseUrl + "/storage/v1/object/public/" + bucket + "/";
        if (!publicUrl.startsWith(prefix)) {
            throw new IllegalArgumentException("URL does not belong to bucket: " + bucket);
        }
        return publicUrl.substring(prefix.length());
    }

    private UploadUrlResponse generateSignedUploadUrl(String bucket, String objectPath) {
        SignedUploadResponse response = restClient.post()
                .uri("/object/sign/upload/{bucket}/{path}", bucket, objectPath)
                .contentType(MediaType.APPLICATION_JSON)
                .retrieve()
                .body(SignedUploadResponse.class);

        return new UploadUrlResponse(supabaseUrl + response.url(), objectPath);
    }

    private record SignedUploadResponse(String url, String token, String path) {}
}
