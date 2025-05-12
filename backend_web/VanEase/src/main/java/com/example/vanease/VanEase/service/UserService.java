package com.example.vanease.VanEase.service;

import com.example.vanease.VanEase.model.User;
import com.example.vanease.VanEase.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;

@Service
public class UserService {
    private static final Logger logger = LoggerFactory.getLogger(UserService.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Transactional
    public User createUser(User user) {
        try {
            logger.info("Creating new user with email: {}", user.getEmail());
            
            // Validate required fields
            if (user.getEmail() == null || user.getEmail().trim().isEmpty()) {
                throw new IllegalArgumentException("Email is required");
            }
            if (user.getName() == null || user.getName().trim().isEmpty()) {
                throw new IllegalArgumentException("Name is required");
            }
            if (user.getRole() == null) {
                throw new IllegalArgumentException("Role is required");
            }

            // Check if user already exists
            if (userRepository.findByEmail(user.getEmail()).isPresent()) {
                throw new IllegalArgumentException("User with this email already exists");
            }

            // Trim all string fields
            user.setEmail(user.getEmail().trim());
            user.setName(user.getName().trim());
            if (user.getGoogleId() != null) {
                user.setGoogleId(user.getGoogleId().trim());
            }
            if (user.getProfilePicture() != null) {
                user.setProfilePicture(user.getProfilePicture().trim());
            }

            // Only encode password if it's provided (not for Google OAuth users)
            if (user.getPassword() != null && !user.getPassword().trim().isEmpty()) {
                user.setPassword(passwordEncoder.encode(user.getPassword().trim()));
            }

            // Save the user
            User savedUser = userRepository.save(user);
            logger.info("Successfully created user with ID: {}", savedUser.getUserId());
            return savedUser;
        } catch (DataIntegrityViolationException e) {
            logger.error("Database constraint violation while creating user: {}", e.getMessage());
            throw new IllegalArgumentException("Error creating user: " + e.getMessage());
        } catch (Exception e) {
            logger.error("Error creating user: {}", e.getMessage());
            throw new IllegalArgumentException("Error creating user: " + e.getMessage());
        }
    }

    public User findByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found with email: " + email));
    }

    public User findById(Integer id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + id));
    }
} 