package com.hiddengems.api.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

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

    public void deleteFile(String bucket, String objectPath) {
        restClient.delete()
                .uri("/object/" + bucket + "/" + objectPath)
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
}
