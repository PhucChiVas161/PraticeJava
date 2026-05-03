package com.example.demo.dto;

import java.util.List;

public record MenuCategoryDto(
        Long id,
        String name,
        int sortOrder,
        List<MenuItemDto> items) {
}
