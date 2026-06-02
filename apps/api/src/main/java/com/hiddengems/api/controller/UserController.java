package com.hiddengems.api.controller;

import com.hiddengems.api.dto.user.PublicUserResponse;
import com.hiddengems.api.dto.user.UpdateUserRequest;
import com.hiddengems.api.dto.user.UserResponse;
import com.hiddengems.api.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    // GET /api/users/{id}
    @GetMapping("/{id}")
    public ResponseEntity<?> getUserById(@PathVariable UUID id, JwtAuthenticationToken auth) {
        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (isAdmin) {
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

    // GET /api/users/me
    @GetMapping("/me")
    public ResponseEntity<UserResponse> getMe(JwtAuthenticationToken auth) {
        UUID userId = UUID.fromString(auth.getName());
        return ResponseEntity.ok(userService.getById(userId));
    }
}