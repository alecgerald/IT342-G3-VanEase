package com.example.vanease.VanEase.service;

import com.example.vanease.VanEase.exception.ResourceNotFoundException;
import com.example.vanease.VanEase.model.Vehicle;
import com.example.vanease.VanEase.repository.VehicleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;

@Service
public class VehicleService {

    @Autowired
    private VehicleRepository vehicleRepository;

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

    public String saveImage(MultipartFile image) {
        try {
            String fileName = UUID.randomUUID() + "_" + image.getOriginalFilename();
            Path imagePath = Paths.get("frontend_web/vanease_frontend/public/images/" + fileName); // Save in /public/images
            Files.createDirectories(imagePath.getParent());
            Files.write(imagePath, image.getBytes());
            System.out.println("Image saved at: " + imagePath.toAbsolutePath()); // Debugging log
            return "/images/" + fileName; // Return relative path for frontend access
        } catch (IOException e) {
            throw new RuntimeException("Failed to save image", e);
        }
    }
}
