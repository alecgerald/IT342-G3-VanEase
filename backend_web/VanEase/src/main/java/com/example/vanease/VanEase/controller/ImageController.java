package com.example.vanease.VanEase.controller;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;

@RestController
@RequestMapping("/api/vehicles/images")
@CrossOrigin(origins = "*")
public class ImageController {

    private static final Logger logger = LoggerFactory.getLogger(ImageController.class);
    private static final String UPLOAD_DIR = "uploads/vehicles";

    @GetMapping("/{filename}")
    public ResponseEntity<Resource> getImage(@PathVariable String filename) {
        try {
            Path filePath = Paths.get(UPLOAD_DIR, filename);
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists() && resource.isReadable()) {
                return ResponseEntity.ok()
                    .contentType(MediaType.IMAGE_JPEG) // You might want to determine this dynamically
                    .body(resource);
            } else {
                logger.warn("Image not found: {}", filename);
                return ResponseEntity.notFound().build();
            }
        } catch (IOException e) {
            logger.error("Error serving image: {}", filename, e);
            return ResponseEntity.internalServerError().build();
        }
    }
} 