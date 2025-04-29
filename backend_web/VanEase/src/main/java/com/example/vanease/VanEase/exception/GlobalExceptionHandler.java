package com.example.vanease.VanEase.exception;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler({
            InvalidPaymentException.class,
            PaymentExistsException.class,
            InvalidBookingStateException.class,
            PaymentProcessingException.class,
            InvalidPaymentStateException.class
    })
    public ResponseEntity<String> handleCustomExceptions(RuntimeException ex) {
        return ResponseEntity.badRequest().body(ex.getMessage());
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<String> handleMaxUploadSizeExceededException(MaxUploadSizeExceededException ex) {
        return ResponseEntity.badRequest().body("File size exceeds the maximum allowed limit.");
    }
}