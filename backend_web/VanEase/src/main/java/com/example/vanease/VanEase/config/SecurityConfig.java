package com.example.vanease.VanEase.config;

import com.example.vanease.VanEase.security.filter.JwtAuthFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.http.HttpMethod;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configure(http))  // Enable CORS
            .authorizeHttpRequests(authz -> authz
                // Public endpoints
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/vehicles/**").permitAll()

                // PayPal endpoints - allow authenticated users
                .requestMatchers("/api/paypal/**").hasAnyAuthority("ROLE_CUSTOMER", "ROLE_MANAGER")

                // Customer endpoints
                .requestMatchers("/api/user/**").hasAuthority("ROLE_CUSTOMER")
                .requestMatchers(HttpMethod.GET, "/api/bookings/user").hasAuthority("ROLE_CUSTOMER")
                .requestMatchers(HttpMethod.POST, "/api/bookings").hasAuthority("ROLE_CUSTOMER")
                .requestMatchers(HttpMethod.POST, "/api/bookings/*/cancel").hasAuthority("ROLE_CUSTOMER")

                // Manager endpoints - update to be more specific
                .requestMatchers(HttpMethod.GET, "/api/bookings/all").hasAuthority("ROLE_MANAGER")
                .requestMatchers(HttpMethod.GET, "/api/bookings/{id}").hasAuthority("ROLE_MANAGER")
                .requestMatchers(HttpMethod.POST, "/api/bookings/*/confirm").hasAuthority("ROLE_MANAGER")
                .requestMatchers(HttpMethod.POST, "/api/bookings/*/complete").hasAuthority("ROLE_MANAGER")
                .requestMatchers("/api/vehicles/**").hasAuthority("ROLE_MANAGER")
                .requestMatchers("/api/transactions/**").hasAuthority("ROLE_MANAGER")

                // All other requests
                .anyRequest().authenticated()
            )
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsFilter corsFilter() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowCredentials(true);
        config.addAllowedOrigin("https://it-342-g3-van-ease.vercel.app"); // Production frontend
        config.addAllowedOrigin("https://it-342-g3-van-ease-git-integration-alec-alecgeralds-projects.vercel.app"); // Preview frontend
        config.addAllowedHeader("*");
        config.addAllowedMethod("*");
        source.registerCorsConfiguration("/**", config);
        return new CorsFilter(source);
    }
}
