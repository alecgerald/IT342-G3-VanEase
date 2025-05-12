package com.example.vanease.VanEase.service;
import com.example.vanease.VanEase.dto.LoginRequest;
import com.example.vanease.VanEase.dto.RegisterRequest;
import com.example.vanease.VanEase.model.Role;
import com.example.vanease.VanEase.model.User;
import com.example.vanease.VanEase.repository.UserRepository;
import com.example.vanease.VanEase.security.service.JwtService;

import lombok.RequiredArgsConstructor;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private static final Logger logger = LoggerFactory.getLogger(AuthService.class);

    public ResponseEntity<?> registerUser(RegisterRequest registerRequest) {
        if (userRepository.existsByEmail(registerRequest.getEmail())) {
            return ResponseEntity.badRequest().body("Error: Email is already taken!");
        }

        User user = new User();
        user.setName(registerRequest.getName());
        user.setEmail(registerRequest.getEmail());
        user.setPhone(registerRequest.getPhone());
        user.setPassword(passwordEncoder.encode(registerRequest.getPassword()));
        user.setRole(Role.CUSTOMER);

        userRepository.save(user);
        return ResponseEntity.ok("User registered successfully!");
    }

    public ResponseEntity<?> registerManager(RegisterRequest registerRequest) {
        if (userRepository.existsByEmail(registerRequest.getEmail())) {
            return ResponseEntity.badRequest().body("Error: Email is already taken!");
        }

        User user = new User();
        user.setName(registerRequest.getName());
        user.setEmail(registerRequest.getEmail());
        user.setPhone(registerRequest.getPhone());
        user.setPassword(passwordEncoder.encode(registerRequest.getPassword()));
        user.setRole(Role.MANAGER);

        userRepository.save(user);
        return ResponseEntity.ok("Manager registered successfully!");
    }

    public ResponseEntity<?> authenticateUser(LoginRequest loginRequest) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.getEmail(),
                            loginRequest.getPassword()
                    )
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);

            // Fetch user details
            User user = userRepository.findByEmail(loginRequest.getEmail())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Generate JWT token with role (including ROLE_ prefix)
            String role = "ROLE_" + user.getRole().name();
            String token = jwtService.generateTokenWithRole(authentication.getName(), role);

            logger.debug("User authenticated successfully: {} with role: {}", loginRequest.getEmail(), role);

            // Return the token and role in JSON format
            return ResponseEntity.ok(Map.of(
                "token", token,
                "role", role
            ));
        } catch (Exception e) {
            logger.error("Authentication failed for user: {}", loginRequest.getEmail(), e);
            return ResponseEntity.status(401).body("Authentication failed: " + e.getMessage());
        }
    }
}