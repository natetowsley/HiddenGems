package com.hiddengems.api.service;

import com.hiddengems.api.dto.user.UpdateUserRequest;
import com.hiddengems.api.dto.user.UserResponse;
import com.hiddengems.api.entity.User;
import com.hiddengems.api.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserService userService;

    private User mockUser;
    private UUID userId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        mockUser = new User("John Doe", "johndoe", "john@example.com");
        mockUser.setAvatarUrl("https://example.com/avatar.jpg");
    }

    // --- getById ---

    @Test
    void getById_whenUserExists_returnsUserResponse() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(mockUser));

        UserResponse response = userService.getById(userId);

        assertThat(response.name()).isEqualTo("John Doe");
        assertThat(response.email()).isEqualTo("john@example.com");
    }

    @Test
    void getById_whenUserNotFound_throwsEntityNotFoundException() {
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.getById(userId))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining(userId.toString());
    }

    // --- getByEmail ---

    @Test
    void getByEmail_whenUserExists_returnsUserResponse() {
        when(userRepository.findByEmail("john@example.com")).thenReturn(Optional.of(mockUser));

        UserResponse response = userService.getByEmail("john@example.com");

        assertThat(response.email()).isEqualTo("john@example.com");
    }

    @Test
    void getByEmail_whenUserNotFound_throwsEntityNotFoundException() {
        when(userRepository.findByEmail("ghost@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.getByEmail("ghost@example.com"))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("ghost@example.com");
    }

    // --- updateUser ---

    @Test
    void updateUser_whenUserExists_updatesAndReturnsUserResponse() {
        UpdateUserRequest request = new UpdateUserRequest("Jane Doe", "https://example.com/new.jpg");

        when(userRepository.findById(userId)).thenReturn(Optional.of(mockUser));
        when(userRepository.save(any(User.class))).thenReturn(mockUser);

        UserResponse response = userService.updateUser(userId, request);

        assertThat(response).isNotNull();
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    void updateUser_whenUserNotFound_throwsEntityNotFoundException() {
        UpdateUserRequest request = new UpdateUserRequest("Jane Doe", null);

        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.updateUser(userId, request))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining(userId.toString());

        verify(userRepository, never()).save(any(User.class));
    }

    // --- deleteUser ---

    @Test
    void deleteUser_whenUserExists_deletesSuccessfully() {
        when(userRepository.existsById(userId)).thenReturn(true);

        userService.deleteUser(userId);

        verify(userRepository, times(1)).deleteById(userId);
    }

    @Test
    void deleteUser_whenUserNotFound_throwsEntityNotFoundException() {
        when(userRepository.existsById(userId)).thenReturn(false);

        assertThatThrownBy(() -> userService.deleteUser(userId))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining(userId.toString());

        verify(userRepository, never()).deleteById(any());
    }
}