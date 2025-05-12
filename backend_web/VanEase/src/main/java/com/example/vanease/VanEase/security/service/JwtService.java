package com.example.vanease.VanEase.security.service;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.security.Key;
import java.util.Date;
import java.util.Collections;

@Service
public class JwtService {
    private static final Logger logger = LoggerFactory.getLogger(JwtService.class);
    
    @Value("${jwt.secret}")
    private String secretKey;
    
    @Value("${jwt.expiration}")
    private long expirationTime;

    private Key getSigningKey() {
        try {
            byte[] keyBytes = java.util.HexFormat.of().parseHex(secretKey);
            return Keys.hmacShaKeyFor(keyBytes);
        } catch (Exception e) {
            logger.error("Error creating signing key: {}", e.getMessage());
            throw new RuntimeException("Error creating signing key", e);
        }
    }

    public String generateToken(String username) {
        return Jwts.builder()
                .setSubject(username)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expirationTime))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public Integer extractUserId(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
        return claims.get("userId", Integer.class);
    }

    public String generateTokenWithRole(String username, String role) {
        return Jwts.builder()
                .setSubject(username)
                .claim("role", role)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expirationTime))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public String extractUsername(String token) {
        try {
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(token)
                    .getBody();
            return claims.getSubject();
        } catch (Exception e) {
            logger.error("Error extracting username from token: {}", e.getMessage());
            throw e;
        }
    }

    public String extractRole(String token) {
        try {
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(token)
                    .getBody();
            String role = claims.get("role", String.class);
            logger.debug("Extracted role from token: {}", role);
            if (role == null) {
                logger.warn("No role found in token, defaulting to ROLE_CUSTOMER");
                return "ROLE_CUSTOMER";
            }
            return role;
        } catch (Exception e) {
            logger.error("Error extracting role from token: {}", e.getMessage());
            throw e;
        }
    }

    public boolean validateToken(String token, UserDetails userDetails) {
        try {
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(token)
                    .getBody();

            String username = claims.getSubject();
            String role = claims.get("role", String.class);
            
            if (username == null || role == null) {
                logger.warn("Token validation failed: username or role is null");
                return false;
            }

            boolean isUsernameValid = username.equals(userDetails.getUsername());
            boolean isNotExpired = !claims.getExpiration().before(new Date());
            boolean hasValidRole = userDetails.getAuthorities().stream()
                .anyMatch(auth -> auth.getAuthority().equals(role));

            logger.debug("Token validation for user {}: usernameValid={}, notExpired={}, hasValidRole={}, role={}", 
                username, isUsernameValid, isNotExpired, hasValidRole, role);

            if (!isUsernameValid || !isNotExpired || !hasValidRole) {
                logger.warn("Token validation failed for user {}: usernameValid={}, notExpired={}, hasValidRole={}", 
                    username, isUsernameValid, isNotExpired, hasValidRole);
                return false;
            }

            return true;
        } catch (ExpiredJwtException e) {
            logger.warn("Token expired: {}", e.getMessage());
            return false;
        } catch (SignatureException e) {
            logger.warn("Invalid token signature: {}", e.getMessage());
            return false;
        } catch (Exception e) {
            logger.error("Error validating token: {}", e.getMessage());
            return false;
        }
    }
}
