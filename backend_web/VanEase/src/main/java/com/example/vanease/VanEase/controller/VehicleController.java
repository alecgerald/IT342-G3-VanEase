package com.example.vanease.VanEase.controller;

import com.example.vanease.VanEase.model.Vehicle;
import com.example.vanease.VanEase.security.service.JwtService;
import com.example.vanease.VanEase.service.VehicleService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/api/vehicles")
@CrossOrigin(origins = "*")
@Tag(name = "Vehicle Management", description = "Operations for managing vehicles")
public class VehicleController {

    private static final Logger logger = LoggerFactory.getLogger(VehicleController.class);

    @Autowired
    private VehicleService vehicleService;

    @Autowired
    private JwtService jwtService;

    @Operation(summary = "Get all vehicles", description = "Retrieves a list of all vehicles")
    @ApiResponse(responseCode = "200", description = "Vehicles retrieved successfully")
    @GetMapping
    public List<Vehicle> getAllVehicles() {
        return vehicleService.getAllVehicles();
    }

    @Operation(summary = "Get available vehicles", description = "Retrieves a list of available vehicles")
    @ApiResponse(responseCode = "200", description = "Available vehicles retrieved")
    @GetMapping("/available")
    public List<Vehicle> getAvailableVehicles() {
        return vehicleService.getAvailableVehicles();
    }

    @Operation(summary = "Get vehicle by ID", description = "Retrieves a specific vehicle by its ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Vehicle found"),
            @ApiResponse(responseCode = "404", description = "Vehicle not found")
    })
    @GetMapping("/{id}")
    public ResponseEntity<Vehicle> getVehicleById(
            @Parameter(description = "ID of the vehicle to retrieve")
            @PathVariable Integer id) {
        Vehicle vehicle = vehicleService.getVehicleById(id);
        return ResponseEntity.ok(vehicle);
    }

    @Operation(summary = "Create new vehicle", description = "Adds a new vehicle to the system")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Vehicle created successfully"),
            @ApiResponse(responseCode = "403", description = "Forbidden access")
    })
    @PreAuthorize("hasRole('MANAGER')")
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> createVehicle(
            @RequestParam(value = "brand", required = true) String brand,
            @RequestParam(value = "model", required = true) String model,
            @RequestParam(value = "year", required = true) Integer year,
            @RequestParam(value = "rentalRate", required = true) Double rentalRate,
            @RequestParam(value = "plateNumber", required = true) String plateNumber,
            @RequestParam(value = "availability", required = true) Boolean availability,
            @RequestParam(value = "seatingCapacity", required = true) Integer seatingCapacity,
            @RequestParam(value = "transmission", required = true) String transmission,
            @RequestPart(value = "image", required = false) MultipartFile image,
            @RequestHeader("Authorization") String authorizationHeader) {
        try {
            if (!authorizationHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Invalid authorization header format");
            }

            String token = authorizationHeader.replace("Bearer ", "");
            // Validate token logic here...

            Vehicle vehicle = new Vehicle();
            vehicle.setBrand(brand);
            vehicle.setModel(model);
            vehicle.setYear(year);
            vehicle.setRentalRate(java.math.BigDecimal.valueOf(rentalRate));
            vehicle.setPlateNumber(plateNumber);
            vehicle.setAvailability(availability);
            vehicle.setSeatingCapacity(seatingCapacity);
            vehicle.setTransmission(transmission);

            if (image != null && !image.isEmpty()) {
                String imageUrl = vehicleService.saveImage(image);
                vehicle.setImage(imageUrl);
            }

            Vehicle createdVehicle = vehicleService.createVehicle(vehicle);
            return ResponseEntity.ok(createdVehicle);
        } catch (Exception e) {
            logger.error("Error creating vehicle: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error creating vehicle: " + e.getMessage());
        }
    }

    @Operation(summary = "Update vehicle", description = "Updates an existing vehicle's details")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Vehicle updated successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input data"),
            @ApiResponse(responseCode = "404", description = "Vehicle not found")
    })
    @PreAuthorize("hasRole('MANAGER')")
    @PutMapping("/{id}")
    public ResponseEntity<Vehicle> updateVehicle(
            @Parameter(description = "ID of the vehicle to update") @PathVariable Integer id,
            @Parameter(description = "Updated vehicle details") @Valid @RequestBody Vehicle vehicleDetails) {
        Vehicle updatedVehicle = vehicleService.updateVehicle(id, vehicleDetails);
        return ResponseEntity.ok(updatedVehicle);
    }

    @Operation(summary = "Delete vehicle", description = "Removes a vehicle from the system")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Vehicle deleted successfully"),
            @ApiResponse(responseCode = "400", description = "Cannot delete vehicle with active bookings"),
            @ApiResponse(responseCode = "404", description = "Vehicle not found")
    })
    @PreAuthorize("hasRole('MANAGER')")
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteVehicle(
            @Parameter(description = "ID of the vehicle to delete")
            @PathVariable Integer id) {
        vehicleService.deleteVehicle(id);
        return ResponseEntity.ok().build();
    }
}