package com.example.vanease.VanEase.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class BookingRequest {
    @NotNull(message = "Vehicle ID is required")
    private Integer vehicleId;

    @NotNull(message = "Start date is required")
    @FutureOrPresent(message = "Start date must be today or in the future")
    private LocalDate startDate;

    @NotNull(message = "Total days is required")
    @Min(value = 1, message = "Total days must be at least 1")
    private Long totalDays;

    @NotBlank(message = "Pickup location is required")
    private String pickupLocation;

    @NotBlank(message = "Drop-off location is required")
    private String dropoffLocation;

    @NotNull(message = "Total price is required")
    @DecimalMin(value = "0.01", message = "Total price must be greater than 0")
    private BigDecimal totalPrice;

    @NotBlank(message = "Payment method is required")
    private String paymentMethod;

    private String driverLicenseImage;
}
