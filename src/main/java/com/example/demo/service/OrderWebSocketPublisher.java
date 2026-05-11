package com.example.demo.service;

import com.example.demo.dto.OrderResponse;

public interface OrderWebSocketPublisher {
    void publishNewOrder(OrderResponse response, Long restaurantId);

    void publishOrderStatusUpdate(OrderResponse response, Long restaurantId, Long tableId);
}
