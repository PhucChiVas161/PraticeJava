package com.example.demo.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record CreateOrderRequest(
        @NotBlank String restaurantCode,
        @NotNull Long tableId,
        @NotBlank String idempotencyKey,
        @NotEmpty List<@Valid CreateOrderItemRequest> items) {
}
