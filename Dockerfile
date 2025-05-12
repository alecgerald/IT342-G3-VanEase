# ---- Build Stage ----
FROM eclipse-temurin:17-jdk-alpine as builder

# Install bash and curl for Maven wrapper compatibility
RUN apk add --no-cache bash curl

WORKDIR /app

# Copy only files needed for dependency resolution first (for better build caching)
COPY backend_web/VanEase/mvnw .
COPY backend_web/VanEase/pom.xml .
COPY backend_web/VanEase/.mvn .mvn

# Give execute permission to Maven wrapper
RUN chmod +x mvnw

# Download dependencies (leverages Docker cache)
RUN ./mvnw dependency:go-offline

# Copy the rest of the source code
COPY backend_web/VanEase/src src

# Build the application
RUN ./mvnw clean package -DskipTests

# ---- Run Stage ----
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Copy the built JAR from the builder stage
COPY --from=builder /app/target/VanEase-0.0.1-SNAPSHOT.jar app.jar

# Expose the port (optional, for documentation)
EXPOSE 8080

# Run the Spring Boot application
ENTRYPOINT ["java", "-jar", "app.jar"] 