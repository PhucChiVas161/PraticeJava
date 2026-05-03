package com.example.demo.service;

import com.example.demo.dto.OrderResponse;
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
        String kitchenTopic = "/topic/kitchen/" + restaurantId;
        messagingTemplate.convertAndSend(kitchenTopic, response);
    }

    @Override
    public void publishOrderStatusUpdate(OrderResponse response, Long restaurantId, Long tableId) {
        String kitchenTopic = "/topic/kitchen/" + restaurantId;
        String tableTopic = "/topic/table/" + restaurantId + "/" + tableId;
        messagingTemplate.convertAndSend(kitchenTopic, response);
        messagingTemplate.convertAndSend(tableTopic, response);
    }
}
