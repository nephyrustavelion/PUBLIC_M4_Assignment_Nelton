#Multi-stage Dockerfile for building and running a Java application

# Stage 1: Build the JAR application
FROM maven:3.9.4-eclipse-temurin-21 AS build
WORKDIR /app
COPY . .
RUN mvn clean package -DskipTests 
# -DskipTests means Skips executing tests, but normally still compiles test code

# Stage 2: Run the JAR in a slim runtime image
FROM eclipse-temurin:21-jre-alpine AS runtime
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]

EXPOSE 8081
CMD ["java", "-jar", "app.jar"]

# Note CircleCI also runs Maven to build a JAR.
# If your CircleCI pipeline already builds and tests the JAR, your Dockerfile can simply copy that existing JAR rather than building it again.
# This avoids compiling the same application twice.


# Major | Minor | Patch | Deployment purpose
# Version	Deployment purpose
# 0.1.0	First release
# 0.1.1	Bug-fix release
# 0.2.0	Feature release
# latest	Moving pointer to a chosen image


# docker run -p 8081:8080 taskflow:latest
# curl http://localhost:8081/api/task