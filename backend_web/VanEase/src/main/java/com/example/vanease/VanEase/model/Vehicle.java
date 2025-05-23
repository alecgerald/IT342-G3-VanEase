package com.example.vanease.VanEase.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.DecimalMin;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.math.BigDecimal;
import java.util.List;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "vehicle")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Vehicle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "vehicle_id")
    private Integer vehicleId;

    @Column(name = "plate_number", nullable = false, unique = true)
    @NotBlank(message = "Plate number is required")
    private String plateNumber;

    @Column(nullable = false)
    @NotBlank(message = "Model is required")
    private String model;

    @Column(nullable = false)
    @NotBlank(message = "Brand is required")
    private String brand;

    @Column(nullable = false)
    @NotNull(message = "Year is required")
    @Min(value = 1900, message = "Year must be valid")
    private Integer year;

    @Column(name = "rental_rate", nullable = false, precision = 10, scale = 2)
    @NotNull(message = "Rental rate is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Rental rate must be positive")
    private BigDecimal rentalRate;

    @Column(name = "seating_capacity", nullable = false)
    @NotNull(message = "Seating capacity is required")
    @Min(value = 1, message = "Seating capacity must be at least 1")
    private Integer seatingCapacity;

    @Column(nullable = false)
    private Boolean availability = true;

    @Column(nullable = false)
    @NotBlank(message = "Transmission type is required")
    private String transmission;

    @Column(length = 1000)
    private String description;

    @OneToMany(mappedBy = "vehicle", fetch = FetchType.LAZY)
    @JsonIgnoreProperties({"vehicle", "user", "payment"})
    private List<Booking> bookings;

    @Column(name = "image_url", length = 500)
    private String image;

    public boolean checkAvailability() {
        return this.availability;
    }

    public void updateAvailability(boolean status) {
        this.availability = status;
    }

    public Vehicle viewDetails() {
        return this;
    }

    public void setImage(String image) {
        this.image = image;
    }

    public String getImage() {
        return image;
    }
}