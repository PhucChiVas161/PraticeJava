package com.example.demo.dto;

import com.example.demo.model.enums.OrderItemStatus;

import java.math.BigDecimal;

public record OrderItemResponse(
        Long id,
        Long menuItemId,
        String name,
        int quantity,
        BigDecimal unitPrice,
        BigDecimal lineTotal,
        OrderItemStatus status) {
}
