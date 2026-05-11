package com.example.demo.repository;

import com.example.demo.model.RestaurantTable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RestaurantTableRepository extends JpaRepository<RestaurantTable, Long> {
    Optional<RestaurantTable> findByIdAndRestaurantId(Long id, Long restaurantId);
}
