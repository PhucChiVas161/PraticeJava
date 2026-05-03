package com.example.demo.service;

import com.example.demo.dto.MenuCategoryDto;
import com.example.demo.dto.MenuItemDto;
import com.example.demo.dto.MenuResponse;
import com.example.demo.exception.NotFoundException;
import com.example.demo.model.MenuCategory;
import com.example.demo.model.MenuItem;
import com.example.demo.model.Restaurant;
import com.example.demo.repository.MenuCategoryRepository;
import com.example.demo.repository.MenuItemRepository;
import com.example.demo.repository.RestaurantRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class MenuService {

    private final RestaurantRepository restaurantRepository;
    private final MenuCategoryRepository menuCategoryRepository;
    private final MenuItemRepository menuItemRepository;

    public MenuService(RestaurantRepository restaurantRepository,
            MenuCategoryRepository menuCategoryRepository,
            MenuItemRepository menuItemRepository) {
        this.restaurantRepository = restaurantRepository;
        this.menuCategoryRepository = menuCategoryRepository;
        this.menuItemRepository = menuItemRepository;
    }

    public MenuResponse getMenuByRestaurantCode(String restaurantCode) {
        Restaurant restaurant = restaurantRepository.findByRestaurantCode(restaurantCode)
                .orElseThrow(() -> new NotFoundException("Restaurant not found"));

        List<MenuCategory> categories = menuCategoryRepository
                .findByRestaurantIdAndActiveTrueOrderBySortOrderAsc(restaurant.getId());

        List<Long> categoryIds = categories.stream().map(MenuCategory::getId).toList();
        Map<Long, List<MenuItem>> itemsByCategory = new HashMap<>();

        if (!categoryIds.isEmpty()) {
            List<MenuItem> items = menuItemRepository
                    .findByRestaurantIdAndCategoryIdInAndAvailableTrueOrderByNameAsc(restaurant.getId(), categoryIds);
            itemsByCategory = items.stream().collect(Collectors.groupingBy(item -> item.getCategory().getId()));
        }

        List<MenuCategoryDto> categoryDtos = new ArrayList<>();
        for (MenuCategory category : categories) {
            List<MenuItem> items = itemsByCategory.getOrDefault(category.getId(), List.of());
            List<MenuItemDto> itemDtos = items.stream()
                    .sorted(Comparator.comparing(MenuItem::getName))
                    .map(item -> new MenuItemDto(
                            item.getId(),
                            item.getName(),
                            item.getDescription(),
                            item.getPrice(),
                            item.isAvailable()))
                    .toList();

            categoryDtos.add(new MenuCategoryDto(
                    category.getId(),
                    category.getName(),
                    category.getSortOrder(),
                    itemDtos));
        }

        return new MenuResponse(
                restaurant.getId(),
                restaurant.getRestaurantCode(),
                restaurant.getName(),
                categoryDtos);
    }
}
