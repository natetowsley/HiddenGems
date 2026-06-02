package com.hiddengems.api.controller;

import com.hiddengems.api.dto.user.UserResponse;
import com.hiddengems.api.service.FollowService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/users/{id}")
public class FollowController {

    private final FollowService followService;

    public FollowController(FollowService followService) {
        this.followService = followService;
    }

    // POST /api/users/{id}/follow
    @PostMapping("/follow")
    public ResponseEntity<Void> follow(
            @PathVariable UUID id,
            JwtAuthenticationToken auth
    ) {
        UUID followerId = UUID.fromString(auth.getName());
        followService.follow(id, followerId);
        return ResponseEntity.noContent().build();
    }

    // DELETE /api/users/{id}/follow
    @DeleteMapping("/follow")
    public ResponseEntity<Void> unfollow(
            @PathVariable UUID id,
            JwtAuthenticationToken auth
    ) {
        UUID followerId = UUID.fromString(auth.getName());
        followService.unfollow(id, followerId);
        return ResponseEntity.noContent().build();
    }

    // GET /api/users/{id}/followers
    @GetMapping("/followers")
    public ResponseEntity<List<UserResponse>> getFollowers(@PathVariable UUID id) {
        return ResponseEntity.ok(followService.getFollowers(id));
    }

    // GET /api/users/{id}/following
    @GetMapping("/following")
    public ResponseEntity<List<UserResponse>> getFollowing(@PathVariable UUID id) {
        return ResponseEntity.ok(followService.getFollowing(id));
    }
}
