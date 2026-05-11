package com.example.demo.dto;

import java.util.List;

public record MenuResponse(
        Long restaurantId,
        String restaurantCode,
        String restaurantName,
        List<MenuCategoryDto> categories) {
}
