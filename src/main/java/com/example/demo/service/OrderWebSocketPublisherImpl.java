package com.example.demo.service;

import com.example.demo.dto.OrderResponse;
import com.example.demo.model.enums.OrderStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Component
public class OrderWebSocketPublisherImpl implements OrderWebSocketPublisher {

    private final SimpMessagingTemplate messagingTemplate;

    public OrderWebSocketPublisherImpl(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    @Override
    public void publishNewOrder(OrderResponse response, Long restaurantId) {
        // Send to waiter topic when order is NEW (waiting for waiter confirmation)
        if (response.status() == OrderStatus.NEW) {
            String waiterTopic = "/topic/waiter/" + restaurantId;
            messagingTemplate.convertAndSend(waiterTopic, response);
        } else {
            String kitchenTopic = "/topic/kitchen/" + restaurantId;
            messagingTemplate.convertAndSend(kitchenTopic, response);
        }
    }

    @Override
    public void publishOrderStatusUpdate(OrderResponse response, Long restaurantId, Long tableId) {
        String kitchenTopic = "/topic/kitchen/" + restaurantId;
        String waiterTopic = "/topic/waiter/" + restaurantId;
        String tableTopic = "/topic/table/" + restaurantId + "/" + tableId;

        messagingTemplate.convertAndSend(kitchenTopic, response);
        messagingTemplate.convertAndSend(waiterTopic, response);
        messagingTemplate.convertAndSend(tableTopic, response);
    }
}
