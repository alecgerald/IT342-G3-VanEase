package com.example.vanease.VanEase.controller;

import com.example.vanease.VanEase.service.PayPalService;
import com.example.vanease.VanEase.service.BookingService;
import com.example.vanease.VanEase.model.Booking;
import com.example.vanease.VanEase.model.Payment;
import com.example.vanease.VanEase.model.BookingStatus;
import com.example.vanease.VanEase.exception.ResourceNotFoundException;
import com.paypal.orders.Order;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/paypal")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class PayPalController {
    private static final Logger logger = LoggerFactory.getLogger(PayPalController.class);
    private final PayPalService payPalService;
    private final BookingService bookingService;

    @Autowired
    public PayPalController(PayPalService payPalService, BookingService bookingService) {
        this.payPalService = payPalService;
        this.bookingService = bookingService;
    }

    @PostMapping("/create-order")
    public ResponseEntity<?> createOrder(@RequestBody Map<String, Object> payload) {
        try {
            logger.debug("Creating PayPal order with payload: {}", payload);
            
            if (payload == null || !payload.containsKey("bookingId")) {
                logger.warn("Invalid payload for create-order: {}", payload);
                return ResponseEntity.badRequest().body("Invalid payload: bookingId is required");
            }

            Integer bookingId;
            try {
                bookingId = Integer.parseInt(payload.get("bookingId").toString());
            } catch (NumberFormatException e) {
                logger.warn("Invalid bookingId format: {}", payload.get("bookingId"));
                return ResponseEntity.badRequest().body("Invalid bookingId format");
            }

            // Get booking details
            Booking booking = bookingService.getBookingById(bookingId);
            if (booking == null) {
                return ResponseEntity.badRequest().body("Booking not found");
            }

            if (booking.getTotalPrice() == null || booking.getTotalPrice().doubleValue() <= 0) {
                return ResponseEntity.badRequest().body("Invalid booking amount");
            }

            // Create PayPal order with PHP currency
            Order order = payPalService.createOrder(booking.getTotalPrice().doubleValue(), "PHP");
            logger.info("Successfully created PayPal order: {} for booking: {}", order.id(), bookingId);
            
            Map<String, String> response = new HashMap<>();
            response.put("orderId", order.id());
            response.put("bookingId", bookingId.toString());
            response.put("amount", booking.getTotalPrice().toString());
            response.put("currency", "PHP");
            
            return ResponseEntity.ok(response);
        } catch (ResourceNotFoundException e) {
            logger.warn("Booking not found: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Booking not found: " + e.getMessage());
        } catch (IOException e) {
            logger.error("Error creating PayPal order: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body("Error creating order: " + e.getMessage());
        } catch (Exception e) {
            logger.error("Unexpected error in create-order: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body("Unexpected error: " + e.getMessage());
        }
    }

    @PostMapping("/capture-order/{orderId}")
    public ResponseEntity<?> captureOrder(
            @PathVariable String orderId,
            @RequestParam(required = false) Integer bookingId) {
        try {
            logger.debug("Capturing PayPal order: {} for booking: {}", orderId, bookingId);
            
            if (orderId == null || orderId.trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Order ID is required");
            }

            if (bookingId == null) {
                return ResponseEntity.badRequest().body("Booking ID is required");
            }

            // Get the booking
            Booking booking = bookingService.getBookingById(bookingId);
            if (booking == null) {
                return ResponseEntity.badRequest().body("Booking not found");
            }

            // Capture the PayPal order
            Order order = payPalService.captureOrder(orderId);
            logger.info("Successfully captured PayPal order: {}", order.id());

            // Update payment and booking status
            if (order.status().equals("COMPLETED")) {
                // Get or create payment record
                Payment payment = booking.getPayment();
                if (payment == null) {
                    payment = new Payment();
                    payment.setBooking(booking);
                    payment.setAmount(booking.getTotalPrice().floatValue());
                    payment.setPaymentMethod(Payment.PaymentMethod.PAYPAL);
                }

                // Update payment details
                payment.setPaymentStatus(Payment.PaymentStatus.COMPLETED);
                payment.setPaymentDate(LocalDate.now());
                payment.setTransactionId(order.id());
                booking.setPayment(payment);

                // Update booking status
                booking.confirm();
                bookingService.updateBookingStatus(bookingId, BookingStatus.CONFIRMED);

                logger.info("Payment and booking status updated for booking: {}", bookingId);
            } else {
                logger.warn("PayPal order not completed. Status: {}", order.status());
                return ResponseEntity.badRequest().body("Payment not completed. Status: " + order.status());
            }
            
            Map<String, String> response = new HashMap<>();
            response.put("status", order.status());
            response.put("orderId", order.id());
            response.put("bookingId", bookingId.toString());
            response.put("paymentStatus", booking.getPayment().getPaymentStatus().toString());
            response.put("bookingStatus", booking.getStatus().toString());
            
            return ResponseEntity.ok(response);
        } catch (IOException e) {
            logger.error("Error capturing PayPal order {}: {}", orderId, e.getMessage(), e);
            return ResponseEntity.internalServerError().body("Error capturing order: " + e.getMessage());
        } catch (Exception e) {
            logger.error("Unexpected error in capture-order: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body("Unexpected error: " + e.getMessage());
        }
    }
} 