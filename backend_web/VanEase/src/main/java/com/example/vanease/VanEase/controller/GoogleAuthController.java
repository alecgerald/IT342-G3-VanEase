package com.example.vanease.VanEase.controller;

import com.example.vanease.VanEase.model.User;
import com.example.vanease.VanEase.model.Role;
import com.example.vanease.VanEase.repository.UserRepository;
import com.example.vanease.VanEase.security.service.JwtService;
import com.example.vanease.VanEase.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class GoogleAuthController {
    private static final Logger logger = LoggerFactory.getLogger(GoogleAuthController.class);

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtService jwtService;

    @PostMapping("/google")
    public ResponseEntity<?> googleAuth(@RequestBody Map<String, String> payload) {
        try {
            logger.info("Received Google auth request for email: {}", payload.get("email"));
            
            String email = payload.get("email");
            String name = payload.get("name");
            String googleId = payload.get("googleId");
            String picture = payload.get("picture");

            // Validate required fields
            if (email == null || email.trim().isEmpty()) {
                logger.error("Email is required");
                return ResponseEntity.badRequest().body("Email is required");
            }
            if (name == null || name.trim().isEmpty()) {
                logger.error("Name is required");
                return ResponseEntity.badRequest().body("Name is required");
            }
            if (googleId == null || googleId.trim().isEmpty()) {
                logger.error("Google ID is required");
                return ResponseEntity.badRequest().body("Google ID is required");
            }

            // Check if user exists by email
            Optional<User> existingUser = userRepository.findByEmail(email);
            User user;

            if (existingUser.isPresent()) {
                // Update existing user's Google ID if not set
                user = existingUser.get();
                if (user.getGoogleId() == null) {
                    user.setGoogleId(googleId);
                    user.setProfilePicture(picture);
                    try {
                        userRepository.save(user);
                    } catch (DataIntegrityViolationException e) {
                        logger.error("Error updating user: {}", e.getMessage());
                        return ResponseEntity.badRequest().body("Error updating user account");
                    }
                }
            } else {
                // Create new user
                user = new User();
                user.setEmail(email.trim());
                user.setName(name.trim());
                user.setGoogleId(googleId.trim());
                user.setProfilePicture(picture != null ? picture.trim() : null);
                user.setRole(Role.CUSTOMER);
                
                try {
                    user = userService.createUser(user);
                } catch (DataIntegrityViolationException e) {
                    logger.error("Error creating user: {}", e.getMessage());
                    return ResponseEntity.badRequest().body("Error creating user account");
                }
            }

            // Generate JWT token with role (adding ROLE_ prefix)
            String token = jwtService.generateTokenWithRole(user.getEmail(), "ROLE_" + user.getRole().name());

            // Return user info and token
            Map<String, Object> response = new HashMap<>();
            response.put("token", token);
            response.put("user", user);

            logger.info("Successfully authenticated Google user: {}", email);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error during Google authentication: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("Error during Google authentication: " + e.getMessage());
        }
    }
} 