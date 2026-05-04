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
                                        .findByRestaurantIdAndCategoryIdInAndAvailableTrueOrderByNameAsc(
                                                        restaurant.getId(),
                                                        categoryIds);
                        itemsByCategory = items.stream()
                                        .collect(Collectors.groupingBy(item -> item.getCategory().getId()));
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
                                                        item.getCategory().getId(),
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

        public long addMenuItem(String restaurantCode, MenuItemDto menuItemDto) {
                Restaurant restaurant = restaurantRepository.findByRestaurantCode(restaurantCode)
                                .orElseThrow(() -> new NotFoundException("Restaurant not found"));

                MenuCategory category = menuCategoryRepository.findById(menuItemDto.categoryId())
                                .orElseThrow(() -> new NotFoundException("Menu category not found"));
                if (!category.getRestaurant().getId().equals(restaurant.getId())) {
                        throw new NotFoundException("Menu category not found");
                }

                MenuItem menuItem = new MenuItem();
                menuItem.setRestaurant(restaurant);
                menuItem.setCategory(category);
                menuItem.setName(menuItemDto.name());
                menuItem.setDescription(menuItemDto.description());
                menuItem.setPrice(menuItemDto.price());
                menuItem.setAvailable(menuItemDto.available());

                return menuItemRepository.save(menuItem).getId();
        }

        public long addMenuCategory(String restaurantCode, MenuCategoryDto menuCategoryDto) {
                Restaurant restaurant = restaurantRepository.findByRestaurantCode(restaurantCode)
                                .orElseThrow(() -> new NotFoundException("Restaurant not found"));

                MenuCategory menuCategory = new MenuCategory();
                menuCategory.setRestaurant(restaurant);
                menuCategory.setName(menuCategoryDto.name());
                menuCategory.setSortOrder(menuCategoryDto.sortOrder());

                return menuCategoryRepository.save(menuCategory).getId();
        }

        public long deleteMenuItemById(String restaurantCode, long menuItemId) {
                Restaurant restaurant = restaurantRepository.findByRestaurantCode(restaurantCode)
                                .orElseThrow(() -> new NotFoundException("Restaurant not found"));

                MenuItem menuItem = menuItemRepository.findById(menuItemId)
                                .orElseThrow(() -> new NotFoundException("Menu item not found"));
                if (!menuItem.getRestaurant().getId().equals(restaurant.getId())) {
                        throw new NotFoundException("Menu item not found");
                }

                menuItem.setAvailable(false);
                menuItemRepository.save(menuItem);
                return menuItem.getId();

        }
}
