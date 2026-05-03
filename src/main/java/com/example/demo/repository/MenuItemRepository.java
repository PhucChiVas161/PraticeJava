package com.example.demo.repository;

import com.example.demo.model.MenuItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface MenuItemRepository extends JpaRepository<MenuItem, Long> {
    List<MenuItem> findByRestaurantIdAndCategoryIdInAndAvailableTrueOrderByNameAsc(Long restaurantId,
            Collection<Long> categoryIds);

    List<MenuItem> findByRestaurantIdAndIdIn(Long restaurantId, Collection<Long> ids);
}
