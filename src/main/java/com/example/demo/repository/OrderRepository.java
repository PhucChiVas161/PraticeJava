package com.example.demo.repository;

import com.example.demo.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {
    Optional<Order> findByIdempotencyKey(String idempotencyKey);

    List<Order> findByRestaurantTableIdAndRestaurantIdOrderByCreatedAtDesc(Long tableId, Long restaurantId);

    Optional<Order> findTopByRestaurantTableIdAndRestaurantIdOrderByCreatedAtDesc(Long tableId, Long restaurantId);
}
