package com.example.vanease.VanEase.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class RegisterRequest {
    @NotBlank
    @Size(max = 100)
    private String name;

    @NotBlank
    @Email
    @Size(max = 100)
    private String email;

    @Size(max = 15)
    private String phone;

    @NotBlank
    @Size(min = 6)
    private String password;
}