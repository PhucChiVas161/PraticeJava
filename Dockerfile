# Stage 1: Build the application
FROM eclipse-temurin:25-jdk AS builder
WORKDIR /app

# Copy the Gradle wrapper and configuration files
COPY gradlew .
COPY gradle/ gradle/
COPY build.gradle .
COPY settings.gradle .

# Make the wrapper executable and download dependencies
RUN chmod +x gradlew
RUN ./gradlew dependencies --no-daemon

# Copy source code and build
COPY src/ src/
RUN ./gradlew bootJar --no-daemon

# Stage 2: Run the application
FROM eclipse-temurin:25-jre AS runner
WORKDIR /app

# Copy the built JAR from the builder stage
COPY --from=builder /app/build/libs/*.jar app.jar

# Expose the application port
EXPOSE 8080

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]