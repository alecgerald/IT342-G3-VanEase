package com.example.vanease.VanEase.service;

import com.example.vanease.VanEase.exception.ResourceNotFoundException;
import com.example.vanease.VanEase.model.Vehicle;
import com.example.vanease.VanEase.repository.VehicleRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import jakarta.annotation.PostConstruct;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;

@Service
public class VehicleService {

    private static final String UPLOAD_DIR = "uploads/vehicles";
    private static final Logger logger = LoggerFactory.getLogger(VehicleService.class);

    @Autowired
    private VehicleRepository vehicleRepository;

    @PostConstruct
    public void init() {
        try {
            File uploadDir = new File(UPLOAD_DIR);
            if (!uploadDir.exists()) {
                uploadDir.mkdirs();
            }
        } catch (Exception e) {
            logger.error("Could not create upload directory!", e);
        }
    }

    public List<Vehicle> getAllVehicles() {
        return vehicleRepository.findAll();
    }

    public List<Vehicle> getAvailableVehicles() {
        return vehicleRepository.findByAvailabilityTrue();
    }

    public Vehicle getVehicleById(Integer id) {
        return vehicleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with id: " + id));
    }

    public Vehicle createVehicle(Vehicle vehicle) {
        if (vehicleRepository.existsByPlateNumber(vehicle.getPlateNumber())) {
            throw new IllegalArgumentException("Vehicle with this plate number already exists.");
        }
        return vehicleRepository.save(vehicle);
    }

    public Vehicle updateVehicle(Integer id, Vehicle vehicleDetails) {
        Vehicle vehicle = getVehicleById(id);
        vehicle.setModel(vehicleDetails.getModel());
        vehicle.setBrand(vehicleDetails.getBrand());
        vehicle.setYear(vehicleDetails.getYear());
        vehicle.setRentalRate(vehicleDetails.getRentalRate());
        vehicle.setAvailability(vehicleDetails.getAvailability());
        vehicle.setImage(vehicleDetails.getImage()); // Update image
        return vehicleRepository.save(vehicle);
    }

    public void deleteVehicle(Integer id) {
        Vehicle vehicle = getVehicleById(id);
        vehicleRepository.delete(vehicle);
    }

    public String saveImage(MultipartFile file) {
        try {
            if (file == null || file.isEmpty()) {
                return null;
            }

            // Generate unique filename
            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            String filename = UUID.randomUUID().toString() + extension;

            // Create the file path
            Path filePath = Paths.get(UPLOAD_DIR, filename);
            
            // Save the file
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // Return the relative path for storage in database
            return "/api/vehicles/images/" + filename;
        } catch (IOException e) {
            logger.error("Failed to save image", e);
            throw new RuntimeException("Failed to save image", e);
        }
    }

    public void deleteImage(String imageUrl) {
        if (imageUrl != null && imageUrl.startsWith("/api/vehicles/images/")) {
            try {
                String filename = imageUrl.substring("/api/vehicles/images/".length());
                Path filePath = Paths.get(UPLOAD_DIR, filename);
                Files.deleteIfExists(filePath);
            } catch (IOException e) {
                logger.error("Failed to delete image", e);
            }
        }
    }
}
