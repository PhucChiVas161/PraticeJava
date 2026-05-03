package com.example.demo.dto;

import com.example.demo.model.enums.CallRequestStatus;
import com.example.demo.model.enums.CallRequestType;

import java.time.Instant;

public record CallResponse(
        Long id,
        CallRequestType type,
        CallRequestStatus status,
        Instant createdAt) {
}
