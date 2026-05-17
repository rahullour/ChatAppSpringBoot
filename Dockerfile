# Step 1: Build the app using Maven with JDK 21
FROM maven:3.9.6-eclipse-temurin-21-alpine AS build
COPY . .
RUN mvn clean package -DskipTests

# Step 2: Run the app using a slim JDK 21 image
FROM eclipse-temurin:21-jdk-alpine
COPY --from=build /target/*.jar app.jar
# CRITICAL: Limit memory to fit in Render's Free Tier (512MB)
ENTRYPOINT ["java","-Xmx350m","-Xms128m","-XX:+UseSerialGC","-jar","/app.jar"]