package com.hiddengems.api.service;

import com.hiddengems.api.dto.user.UpdateUserRequest;
import com.hiddengems.api.dto.user.UserResponse;
import com.hiddengems.api.entity.User;
import com.hiddengems.api.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@Transactional
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    // Find
    @Transactional(readOnly = true)
    public UserResponse getById(UUID id) {
        return userRepository.findById(id)
                .map(UserResponse::from)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + id));
    }

    @Transactional(readOnly = true)
    public UserResponse getByEmail(String email) {
        return userRepository.findByEmail(email)
                .map(UserResponse::from)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + email));
    }

    // Update
    public UserResponse updateUser(UUID id, UpdateUserRequest request, UUID requesterId) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + id));

        checkOwnership(user, requesterId);

        user.setName(request.name());
        user.setAvatarUrl(request.avatarUrl());

        return UserResponse.from(userRepository.save(user));
    }

    // Delete
    public void deleteUser(UUID id, UUID requesterId) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + id));

        checkOwnership(user, requesterId);

        userRepository.deleteById(id);
    }

    // Helpers

    private void checkOwnership(User target, UUID requesterId) {
        if (target.getId().equals(requesterId)) {
            return;
        }
        User requester = userRepository.findById(requesterId)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + requesterId));
        if (requester.getRole() == User.Role.admin) {
            return;
        }
        throw new AccessDeniedException("You do not have permission to modify this account");
    }
}