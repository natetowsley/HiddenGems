package com.hiddengems.api.controller;

import com.hiddengems.api.dto.collection.CollectionResponse;
import com.hiddengems.api.dto.location.LocationResponse;
import com.hiddengems.api.dto.user.PublicUserResponse;
import com.hiddengems.api.dto.user.UpdateUserRequest;
import com.hiddengems.api.dto.user.UserResponse;
import com.hiddengems.api.service.CollectionService;
import com.hiddengems.api.service.LocationService;
import com.hiddengems.api.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    private final LocationService locationService;
    private final CollectionService collectionService;

    public UserController(UserService userService, LocationService locationService, CollectionService collectionService) {
        this.userService = userService;
        this.locationService = locationService;
        this.collectionService = collectionService;
    }

    // GET /api/users/{id}
    @GetMapping("/{id}")
    public ResponseEntity<?> getUserById(@PathVariable UUID id, JwtAuthenticationToken auth) {
        UUID requesterId = UUID.fromString(auth.getName());
        boolean isSelf = id.equals(requesterId);
        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (isSelf || isAdmin) {
            return ResponseEntity.ok(userService.getById(id));
        }
        return ResponseEntity.ok(userService.getPublicById(id));
    }

    // PUT /api/users/{id}
    @PutMapping("/{id}")
    public ResponseEntity<UserResponse> updateUser(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateUserRequest request,
            JwtAuthenticationToken auth) {
        UUID requesterId = UUID.fromString(auth.getName());
        return ResponseEntity.ok(userService.updateUser(id, request, requesterId));
    }

    // DELETE /api/users/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(
            @PathVariable UUID id,
            JwtAuthenticationToken auth) {
        UUID requesterId = UUID.fromString(auth.getName());
        userService.deleteUser(id, requesterId);
        return ResponseEntity.noContent().build();
    }

    // GET /api/users/{id}/locations
    @GetMapping("/{id}/locations")
    public ResponseEntity<List<LocationResponse>> getUserLocations(@PathVariable UUID id, JwtAuthenticationToken auth) {
        UUID requesterId = UUID.fromString(auth.getName());
        return ResponseEntity.ok(locationService.getPublicByUser(id, requesterId));
    }

    // GET /api/users/{id}/collections
    @GetMapping("/{id}/collections")
    public ResponseEntity<List<CollectionResponse>> getUserCollections(@PathVariable UUID id, JwtAuthenticationToken auth) {
        UUID requesterId = UUID.fromString(auth.getName());
        return ResponseEntity.ok(collectionService.getPublicByUser(id, requesterId));
    }

    // GET /api/users/me
    @GetMapping("/me")
    public ResponseEntity<UserResponse> getMe(JwtAuthenticationToken auth) {
        UUID userId = UUID.fromString(auth.getName());
        return ResponseEntity.ok(userService.getById(userId));
    }
}