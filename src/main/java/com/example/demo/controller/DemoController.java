package com.example.demo.controller;

import com.example.demo.model.User;
import com.example.demo.service.DemoServices;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/demo") // Note: full path will be /api/v1/demo due to context-path
public class DemoController {

    @Autowired
    private DemoServices demoServices;

    @GetMapping("/hello")
    public ResponseEntity<Map<String, Object>> hello() {
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Hello, World!");
        response.put("timestamp", java.time.LocalDateTime.now());
        response.put("status", "success");

        return ResponseEntity.ok(response);
    }

    @GetMapping("/services")
    public ResponseEntity<Map<String, Object>> getServiceMessage() {
        String serviceMessage = demoServices.getServiceMessage();

        Map<String, Object> response = new HashMap<>();
        response.put("message", serviceMessage);
        response.put("timestamp", java.time.LocalDateTime.now());
        response.put("status", "success");

        return ResponseEntity.ok(response);
    }

    @GetMapping("/complex-data")
    public ResponseEntity<Map<String, Object>> getComplexData() {
        Object complexData = demoServices.getComplexData();

        Map<String, Object> response = new HashMap<>();
        response.put("data", complexData);
        response.put("timestamp", java.time.LocalDateTime.now());
        response.put("status", "success");

        return ResponseEntity.ok(response);
    }

    // CRUD Endpoints for User

    // Create User
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/users")
    public ResponseEntity<Map<String, Object>> createUser(@RequestBody User user) {
        User createdUser = demoServices.createUser(user);
        Map<String, Object> response = new HashMap<>();
        response.put("user", createdUser);
        response.put("message", "User created successfully");
        response.put("status", "success");
        return ResponseEntity.ok(response);
    }

    // Get All Users
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    @GetMapping("/users")
    public ResponseEntity<Map<String, Object>> getAllUsers() {
        List<User> users = demoServices.getAllUsers();
        Map<String, Object> response = new HashMap<>();
        response.put("users", users);
        response.put("count", users.size());
        response.put("status", "success");
        return ResponseEntity.ok(response);
    }

    // Get User by ID
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    @GetMapping("/users/{id}")
    public ResponseEntity<Map<String, Object>> getUserById(@PathVariable("id") Long id) {
        Optional<User> user = demoServices.getUserById(id);
        Map<String, Object> response = new HashMap<>();
        if (user.isPresent()) {
            response.put("user", user.get());
            response.put("status", "success");
            return ResponseEntity.ok(response);
        } else {
            response.put("message", "User not found");
            response.put("status", "error");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }
    }

    // Get Users by Name
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    @GetMapping("/users/search")
    public ResponseEntity<Map<String, Object>> getUsersByName(@RequestParam("name") String name) {
        List<User> users = demoServices.getUsersByName(name);
        Map<String, Object> response = new HashMap<>();
        response.put("users", users);
        response.put("count", users.size());
        response.put("status", "success");
        return ResponseEntity.ok(response);
    }

    // Update User
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/users/{id}")
    public ResponseEntity<Map<String, Object>> updateUser(@PathVariable("id") Long id, @RequestBody User userDetails) {
        User updatedUser = demoServices.updateUser(id, userDetails);
        Map<String, Object> response = new HashMap<>();
        if (updatedUser != null) {
            response.put("user", updatedUser);
            response.put("message", "User updated successfully");
            response.put("status", "success");
            return ResponseEntity.ok(response);
        } else {
            response.put("message", "User not found");
            response.put("status", "error");
            return ResponseEntity.notFound().build();
        }
    }

    // Delete User
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/users/{id}")
    public ResponseEntity<Map<String, Object>> deleteUser(@PathVariable("id") Long id) {
        boolean deleted = demoServices.deleteUser(id);
        Map<String, Object> response = new HashMap<>();
        if (deleted) {
            response.put("message", "User deleted successfully");
            response.put("status", "success");
            return ResponseEntity.ok(response);
        } else {
            response.put("message", "User not found");
            response.put("status", "error");
            return ResponseEntity.notFound().build();
        }
    }

    // Initialize Demo Data
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/init-demo-data")
    public ResponseEntity<Map<String, Object>> initDemoData() {
        demoServices.initializeDemoData();
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Demo data initialized");
        response.put("status", "success");
        return ResponseEntity.ok(response);
    }
}