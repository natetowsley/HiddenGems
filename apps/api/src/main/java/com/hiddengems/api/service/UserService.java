package com.hiddengems.api.service;

import com.hiddengems.api.dto.user.CreateUserRequest;
import com.hiddengems.api.dto.user.UpdateUserRequest;
import com.hiddengems.api.dto.user.UserResponse;
import com.hiddengems.api.entity.User;
import com.hiddengems.api.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
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

    // Create
    public UserResponse createUser(CreateUserRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new IllegalStateException("Email already in use: " + request.email());
        }

        User user = new User(request.name(), request.username(), request.email());
        user.setAvatarUrl(request.avatarUrl());

        return UserResponse.from(userRepository.save(user));
    }

    // Update
    public UserResponse updateUser(UUID id, UpdateUserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + id));

        user.setName(request.name());
        user.setAvatarUrl(request.avatarUrl());

        return UserResponse.from(userRepository.save(user));
    }

    // Delete
    public void deleteUser(UUID id) {
        if (!userRepository.existsById(id)) {
            throw new EntityNotFoundException("User not found: " + id);
        }
        userRepository.deleteById(id);
    }

    // OAuth helper
    public UserResponse findOrCreate(CreateUserRequest request) {
        return userRepository.findByEmail(request.email())
                .map(UserResponse::from)
                .orElseGet(() -> createUser(request));
    }
}