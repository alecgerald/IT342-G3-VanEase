package com.example.vanease.VanEase.controller;

// Add the correct import for BookingRequest
import com.example.vanease.VanEase.dto.BookingRequest;
import com.example.vanease.VanEase.model.Booking;
import com.example.vanease.VanEase.model.BookingStatus;
import com.example.vanease.VanEase.model.User;
import com.example.vanease.VanEase.model.Vehicle;
import com.example.vanease.VanEase.model.Payment;
import com.example.vanease.VanEase.model.Role;
import com.example.vanease.VanEase.service.BookingService;
import com.example.vanease.VanEase.security.service.JwtService;
import com.example.vanease.VanEase.repository.UserRepository;
import com.example.vanease.VanEase.repository.VehicleRepository;
import com.example.vanease.VanEase.exception.ResourceNotFoundException;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/bookings")
@CrossOrigin(origins = "*")
public class BookingController {

    private final BookingService bookingService;
    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final VehicleRepository vehicleRepository;
    private static final Logger logger = LoggerFactory.getLogger(BookingController.class);

    @Autowired
    public BookingController(BookingService bookingService, JwtService jwtService, UserRepository userRepository, VehicleRepository vehicleRepository) {
        this.bookingService = bookingService;
        this.jwtService = jwtService;
        this.userRepository = userRepository;
        this.vehicleRepository = vehicleRepository;
    }

    @PostMapping
    public ResponseEntity<?> createBooking(
            @Valid @RequestBody BookingRequest bookingRequest,
            @RequestHeader(value = "Authorization") String authorizationHeader) {
        try {
            if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(401).body("Unauthorized: Missing or invalid token.");
            }

            String token = authorizationHeader.replace("Bearer ", "");
            String username = jwtService.extractUsername(token);

            if (username == null || username.isEmpty()) {
                return ResponseEntity.status(400).body("Invalid token: Unable to extract username.");
            }

            User user = userRepository.findByEmail(username)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + username));

            Vehicle vehicle = vehicleRepository.findById(bookingRequest.getVehicleId())
                    .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with ID: " + bookingRequest.getVehicleId()));

            if (!vehicle.getAvailability()) {
                return ResponseEntity.status(400).body("Vehicle is not available for booking.");
            }

            Booking booking = new Booking();
            booking.setUser(user);
            booking.setVehicle(vehicle);
            booking.setStartDate(bookingRequest.getStartDate());
            booking.setEndDate(bookingRequest.getStartDate().plusDays(bookingRequest.getTotalDays() - 1));
            booking.setPickupLocation(bookingRequest.getPickupLocation());
            booking.setDropoffLocation(bookingRequest.getDropoffLocation());
            booking.setTotalDays(bookingRequest.getTotalDays());
            booking.setTotalPrice(bookingRequest.getTotalPrice());

            // Create payment record if payment method is provided
            if (bookingRequest.getPaymentMethod() != null) {
                Payment payment = new Payment();
                payment.setBooking(booking);
                payment.setAmount(bookingRequest.getTotalPrice().floatValue());
                payment.setPaymentMethod(Payment.PaymentMethod.valueOf(bookingRequest.getPaymentMethod().toUpperCase()));
                payment.setPaymentStatus(Payment.PaymentStatus.PENDING);
                payment.setPaymentDate(LocalDate.now());
                booking.setPayment(payment);
            }

            Booking createdBooking = bookingService.createBooking(booking);
            return ResponseEntity.ok(createdBooking);
        } catch (Exception e) {
            return ResponseEntity.status(400).body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/user")
    public ResponseEntity<?> getUserBookings(@RequestHeader(value = "Authorization") String authorizationHeader) {
        try {
            if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(401).body("Unauthorized: Missing or invalid token.");
            }

            String token = authorizationHeader.replace("Bearer ", "");
            String username = jwtService.extractUsername(token);

            if (username == null || username.isEmpty()) {
                return ResponseEntity.status(400).body("Invalid token: Unable to extract username.");
            }

            User user = userRepository.findByEmail(username)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + username));

            List<Booking> bookings = bookingService.getBookingsByUserId(user.getUserId());

            // Map bookings to include only necessary fields
            List<Map<String, Object>> response = bookings.stream().map(booking -> {
                Map<String, Object> bookingData = new HashMap<>();
                bookingData.put("bookingId", booking.getBookingId());
                bookingData.put("vehicleId", booking.getVehicle().getVehicleId()); // Only include vehicleId
                bookingData.put("startDate", booking.getStartDate());
                bookingData.put("endDate", booking.getEndDate());
                bookingData.put("pickupLocation", booking.getPickupLocation());
                bookingData.put("dropoffLocation", booking.getDropoffLocation());
                bookingData.put("status", booking.getStatus());
                bookingData.put("price", booking.getTotalPrice());
                return bookingData;
            }).collect(Collectors.toList());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(400).body("Error: " + e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<?> getAllBookings(@RequestHeader(value = "Authorization") String authorizationHeader) {
        try {
            if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(401).body("Unauthorized: Missing or invalid token.");
            }

            String token = authorizationHeader.replace("Bearer ", "");
            String username = jwtService.extractUsername(token);
            String role = jwtService.extractRole(token);

            logger.debug("Getting all bookings for user: {} with role: {}", username, role);

            if (username == null || username.isEmpty()) {
                return ResponseEntity.status(400).body("Invalid token: Unable to extract username.");
            }

            User user = userRepository.findByEmail(username)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + username));

            if (!role.equals("ROLE_MANAGER")) {
                logger.warn("Access denied for user: {} with role: {}", username, role);
                return ResponseEntity.status(403).body("Access denied. Manager role required.");
            }

            List<Booking> bookings = bookingService.getAllBookings();
            logger.debug("Successfully retrieved {} bookings", bookings.size());

            // Map bookings to include all necessary fields
            List<Map<String, Object>> response = bookings.stream().map(booking -> {
                Map<String, Object> bookingData = new HashMap<>();
                bookingData.put("bookingId", booking.getBookingId());
                bookingData.put("user", booking.getUser());
                bookingData.put("vehicle", booking.getVehicle());
                bookingData.put("startDate", booking.getStartDate());
                bookingData.put("endDate", booking.getEndDate());
                bookingData.put("pickupLocation", booking.getPickupLocation());
                bookingData.put("dropoffLocation", booking.getDropoffLocation());
                bookingData.put("status", booking.getStatus());
                bookingData.put("totalPrice", booking.getTotalPrice());
                bookingData.put("totalDays", booking.getTotalDays());
                bookingData.put("payment", booking.getPayment());
                return bookingData;
            }).collect(Collectors.toList());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error getting all bookings: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/{id}/confirm")
    public ResponseEntity<?> confirmBooking(
            @PathVariable Integer id,
            @RequestHeader(value = "Authorization") String authorizationHeader) {
        try {
            if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(401).body("Unauthorized: Missing or invalid token.");
            }

            String token = authorizationHeader.replace("Bearer ", "");
            String username = jwtService.extractUsername(token);
            String role = jwtService.extractRole(token);

            if (username == null || username.isEmpty()) {
                return ResponseEntity.status(400).body("Invalid token: Unable to extract username.");
            }

            if (!role.equals("ROLE_MANAGER")) {
                return ResponseEntity.status(403).body("Access denied. Manager role required.");
            }

            Booking updatedBooking = bookingService.updateBookingStatus(id, BookingStatus.CONFIRMED);
            return ResponseEntity.ok(updatedBooking);
        } catch (Exception e) {
            logger.error("Error confirming booking: {}", e.getMessage(), e);
            return ResponseEntity.status(400).body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<?> cancelBooking(
            @PathVariable Integer id,
            @RequestHeader(value = "Authorization") String authorizationHeader) {
        try {
            if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(401).body("Unauthorized: Missing or invalid token.");
            }

            String token = authorizationHeader.replace("Bearer ", "");
            String username = jwtService.extractUsername(token);
            String role = jwtService.extractRole(token);

            if (username == null || username.isEmpty()) {
                return ResponseEntity.status(400).body("Invalid token: Unable to extract username.");
            }

            User user = userRepository.findByEmail(username)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + username));

            Booking booking = bookingService.getBookingById(id);

            // Check if user is authorized to cancel this booking
            if (!role.equals("ROLE_MANAGER") && !booking.getUser().getUserId().equals(user.getUserId())) {
                return ResponseEntity.status(403).body("Access denied. You can only cancel your own bookings.");
            }

            // Check if booking can be cancelled
            if (!booking.isCancellable()) {
                return ResponseEntity.status(400).body("This booking cannot be cancelled.");
            }

            Booking updatedBooking = bookingService.updateBookingStatus(id, BookingStatus.CANCELLED);
            return ResponseEntity.ok(updatedBooking);
        } catch (Exception e) {
            logger.error("Error cancelling booking: {}", e.getMessage(), e);
            return ResponseEntity.status(400).body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<?> completeBooking(
            @PathVariable Integer id,
            @RequestHeader(value = "Authorization") String authorizationHeader) {
        try {
            if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(401).body("Unauthorized: Missing or invalid token.");
            }

            String token = authorizationHeader.replace("Bearer ", "");
            String username = jwtService.extractUsername(token);
            String role = jwtService.extractRole(token);

            if (username == null || username.isEmpty()) {
                return ResponseEntity.status(400).body("Invalid token: Unable to extract username.");
            }

            if (!role.equals("ROLE_MANAGER")) {
                return ResponseEntity.status(403).body("Access denied. Manager role required.");
            }

            Booking updatedBooking = bookingService.updateBookingStatus(id, BookingStatus.COMPLETED);
            return ResponseEntity.ok(updatedBooking);
        } catch (Exception e) {
            logger.error("Error completing booking: {}", e.getMessage(), e);
            return ResponseEntity.status(400).body("Error: " + e.getMessage());
        }
    }
}