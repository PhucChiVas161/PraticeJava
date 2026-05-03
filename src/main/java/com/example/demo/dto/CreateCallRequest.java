package com.example.demo.dto;

import com.example.demo.model.enums.CallRequestType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateCallRequest(
        @NotBlank String restaurantCode,
        @NotNull Long tableId,
        @NotNull CallRequestType type) {
}
