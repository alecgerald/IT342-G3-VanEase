package com.example.vanease.VanEase.controller;

import com.example.vanease.VanEase.model.User;
import com.example.vanease.VanEase.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/manager")
@RequiredArgsConstructor
public class ManagerController {

    private final UserRepository userRepository;

    @GetMapping("/details")
    public ResponseEntity<?> getManagerDetails(Authentication authentication) {
        String email = authentication.getName();
        User manager = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Manager not found"));
        return ResponseEntity.ok(manager);
    }
}
