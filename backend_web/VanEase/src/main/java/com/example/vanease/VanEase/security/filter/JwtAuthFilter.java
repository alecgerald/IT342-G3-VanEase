package com.example.vanease.VanEase.security.filter;

import com.example.vanease.VanEase.security.service.JwtService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.http.HttpHeaders;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.SignatureException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {
    private static final Logger logger = LoggerFactory.getLogger(JwtAuthFilter.class);
    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    public JwtAuthFilter(JwtService jwtService, UserDetailsService userDetailsService) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        try {
            final String authHeader = request.getHeader(HttpHeaders.AUTHORIZATION);
            final String requestPath = request.getRequestURI();
            
            // Skip authentication for public endpoints
            if (requestPath.startsWith("/api/auth/") || 
                (requestPath.startsWith("/api/vehicles/") && request.getMethod().equals("GET"))) {
                filterChain.doFilter(request, response);
                return;
            }

            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                logger.debug("No Bearer token found in request to: {}", requestPath);
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.getWriter().write("Missing or invalid authorization token");
                return;
            }

            final String jwt = authHeader.substring(7);
            String username = null;
            String role = null;

            try {
                username = jwtService.extractUsername(jwt);
                role = jwtService.extractRole(jwt);
                logger.debug("Processing JWT for user: {} with role: {} accessing: {}", username, role, requestPath);
            } catch (ExpiredJwtException e) {
                logger.warn("Token expired for request to: {}", requestPath);
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.getWriter().write("Token has expired");
                return;
            } catch (SignatureException e) {
                logger.warn("Invalid token signature for request to: {}", requestPath);
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.getWriter().write("Invalid token signature");
                return;
            } catch (Exception e) {
                logger.error("Error processing token: {}", e.getMessage());
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.getWriter().write("Invalid token");
                return;
            }

            if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                try {
                    UserDetails userDetails = this.userDetailsService.loadUserByUsername(username);
                    
                    if (jwtService.validateToken(jwt, userDetails)) {
                        List<SimpleGrantedAuthority> authorities = new ArrayList<>();
                        authorities.add(new SimpleGrantedAuthority(role));
                        
                        UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                                userDetails,
                                null,
                                authorities
                        );
                        authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                        SecurityContextHolder.getContext().setAuthentication(authToken);
                        
                        logger.debug("Authentication successful for user: {} with role: {} accessing: {}", 
                            username, role, requestPath);
                    } else {
                        logger.warn("Token validation failed for user: {} accessing: {}", username, requestPath);
                        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                        response.getWriter().write("Invalid token");
                        return;
                    }
                } catch (UsernameNotFoundException e) {
                    logger.warn("User not found: {} accessing: {}", username, requestPath);
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.getWriter().write("User not found");
                    return;
                } catch (Exception e) {
                    logger.error("Error during authentication: {}", e.getMessage());
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.getWriter().write("Authentication failed");
                    return;
                }
            }
        } catch (Exception e) {
            logger.error("Unexpected error in JWT filter: {}", e.getMessage(), e);
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.getWriter().write("Internal server error");
            return;
        }
        
        filterChain.doFilter(request, response);
    }
}