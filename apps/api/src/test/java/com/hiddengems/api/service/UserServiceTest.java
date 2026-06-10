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
import org.springframework.security.access.AccessDeniedException;

import java.lang.reflect.Field;
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
    void setUp() throws Exception {
        userId = UUID.randomUUID();
        mockUser = new User("John Doe", "johndoe", "john@example.com");
        mockUser.setAvatarUrl("https://example.com/avatar.jpg");
        setId(mockUser, userId);
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
    void updateUser_asOwner_updatesSuccessfully() {
        UpdateUserRequest request = new UpdateUserRequest("Jane Doe", "johndoe", "https://example.com/new.jpg");

        when(userRepository.findById(userId)).thenReturn(Optional.of(mockUser));
        when(userRepository.save(any(User.class))).thenReturn(mockUser);

        UserResponse response = userService.updateUser(userId, request, userId);

        assertThat(response).isNotNull();
        verify(userRepository).save(any(User.class));
    }

    @Test
    void updateUser_asAdmin_updatesSuccessfully() throws Exception {
        UUID adminId = UUID.randomUUID();
        User adminUser = new User("Admin", "admin", "admin@example.com");
        adminUser.setRole(User.Role.admin);
        setId(adminUser, adminId);

        UpdateUserRequest request = new UpdateUserRequest("Jane Doe", "johndoe", null);

        when(userRepository.findById(userId)).thenReturn(Optional.of(mockUser));
        when(userRepository.findById(adminId)).thenReturn(Optional.of(adminUser));
        when(userRepository.save(any(User.class))).thenReturn(mockUser);

        UserResponse response = userService.updateUser(userId, request, adminId);

        assertThat(response).isNotNull();
        verify(userRepository).save(any(User.class));
    }

    @Test
    void updateUser_asOtherUser_throwsAccessDeniedException() throws Exception {
        UUID otherId = UUID.randomUUID();
        User otherUser = new User("Other", "other", "other@example.com");
        setId(otherUser, otherId);

        UpdateUserRequest request = new UpdateUserRequest("Jane Doe", "johndoe", null);

        when(userRepository.findById(userId)).thenReturn(Optional.of(mockUser));
        when(userRepository.findById(otherId)).thenReturn(Optional.of(otherUser));

        assertThatThrownBy(() -> userService.updateUser(userId, request, otherId))
                .isInstanceOf(AccessDeniedException.class);

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void updateUser_whenUserNotFound_throwsEntityNotFoundException() {
        UpdateUserRequest request = new UpdateUserRequest("Jane Doe", "johndoe", null);

        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.updateUser(userId, request, userId))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining(userId.toString());

        verify(userRepository, never()).save(any(User.class));
    }

    // --- deleteUser ---

    @Test
    void deleteUser_asOwner_deletesSuccessfully() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(mockUser));

        userService.deleteUser(userId, userId);

        verify(userRepository).deleteById(userId);
    }

    @Test
    void deleteUser_asAdmin_deletesSuccessfully() throws Exception {
        UUID adminId = UUID.randomUUID();
        User adminUser = new User("Admin", "admin", "admin@example.com");
        adminUser.setRole(User.Role.admin);
        setId(adminUser, adminId);

        when(userRepository.findById(userId)).thenReturn(Optional.of(mockUser));
        when(userRepository.findById(adminId)).thenReturn(Optional.of(adminUser));

        userService.deleteUser(userId, adminId);

        verify(userRepository).deleteById(userId);
    }

    @Test
    void deleteUser_asOtherUser_throwsAccessDeniedException() throws Exception {
        UUID otherId = UUID.randomUUID();
        User otherUser = new User("Other", "other", "other@example.com");
        setId(otherUser, otherId);

        when(userRepository.findById(userId)).thenReturn(Optional.of(mockUser));
        when(userRepository.findById(otherId)).thenReturn(Optional.of(otherUser));

        assertThatThrownBy(() -> userService.deleteUser(userId, otherId))
                .isInstanceOf(AccessDeniedException.class);

        verify(userRepository, never()).deleteById(any());
    }

    @Test
    void deleteUser_whenUserNotFound_throwsEntityNotFoundException() {
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.deleteUser(userId, userId))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining(userId.toString());

        verify(userRepository, never()).deleteById(any());
    }

    // --- helpers ---

    private void setId(User user, UUID id) throws Exception {
        Field field = User.class.getDeclaredField("id");
        field.setAccessible(true);
        field.set(user, id);
    }
}
