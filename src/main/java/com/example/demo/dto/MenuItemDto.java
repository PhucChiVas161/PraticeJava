package com.example.demo.dto;

import java.math.BigDecimal;

public record MenuItemDto(
        Long id,
        String name,
        String description,
        BigDecimal price,
        Long categoryId,
        boolean available) {
}
