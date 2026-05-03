package com.example.demo.service;

import com.example.demo.dto.CreateOrderItemRequest;
import com.example.demo.dto.CreateOrderRequest;
import com.example.demo.dto.OrderItemResponse;
import com.example.demo.dto.OrderResponse;
import com.example.demo.exception.ConflictException;
import com.example.demo.exception.NotFoundException;
import com.example.demo.model.MenuItem;
import com.example.demo.model.Order;
import com.example.demo.model.OrderItem;
import com.example.demo.model.Restaurant;
import com.example.demo.model.RestaurantTable;
import com.example.demo.model.enums.OrderItemStatus;
import com.example.demo.model.enums.OrderStatus;
import com.example.demo.repository.MenuItemRepository;
import com.example.demo.repository.OrderItemRepository;
import com.example.demo.repository.OrderRepository;
import com.example.demo.repository.RestaurantRepository;
import com.example.demo.repository.RestaurantTableRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class OrderService {

    private static final Logger logger = LoggerFactory.getLogger(OrderService.class);
    private static final Duration DUPLICATE_WINDOW = Duration.ofSeconds(5);

    private final RestaurantRepository restaurantRepository;
    private final RestaurantTableRepository restaurantTableRepository;
    private final MenuItemRepository menuItemRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final OrderWebSocketPublisher orderWebSocketPublisher;

    public OrderService(RestaurantRepository restaurantRepository,
            RestaurantTableRepository restaurantTableRepository,
            MenuItemRepository menuItemRepository,
            OrderRepository orderRepository,
            OrderItemRepository orderItemRepository,
            OrderWebSocketPublisher orderWebSocketPublisher) {
        this.restaurantRepository = restaurantRepository;
        this.restaurantTableRepository = restaurantTableRepository;
        this.menuItemRepository = menuItemRepository;
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.orderWebSocketPublisher = orderWebSocketPublisher;
    }

    @Transactional
    public OrderResponse createOrder(CreateOrderRequest request) {
        Restaurant restaurant = getRestaurant(request.restaurantCode());
        RestaurantTable table = getTable(request.tableId(), restaurant.getId());

        Optional<Order> existing = orderRepository.findByIdempotencyKey(request.idempotencyKey());
        if (existing.isPresent()) {
            return toOrderResponse(existing.get());
        }

        Optional<Order> lastOrderBefore = orderRepository
                .findTopByRestaurantTableIdAndRestaurantIdOrderByCreatedAtDesc(table.getId(), restaurant.getId());

        Map<Long, MenuItem> menuItemMap = loadMenuItems(restaurant.getId(), request.items());
        BigDecimal total = calculateTotal(menuItemMap, request.items());

        Order order = new Order();
        order.setRestaurant(restaurant);
        order.setRestaurantTable(table);
        order.setStatus(OrderStatus.CONFIRMED);
        order.setIdempotencyKey(request.idempotencyKey());
        order.setTotalAmount(total);

        Order savedOrder;

        try {
            savedOrder = orderRepository.save(order);
        } catch (DataIntegrityViolationException ex) {
            Order existingOrder = orderRepository.findByIdempotencyKey(request.idempotencyKey())
                    .orElseThrow(() -> ex);
            return toOrderResponse(existingOrder);
        }

        List<OrderItem> orderItems = request.items().stream()
                .map(item -> {
                    MenuItem menuItem = menuItemMap.get(item.menuItemId());
                    OrderItem orderItem = new OrderItem();
                    orderItem.setOrder(savedOrder);
                    orderItem.setRestaurant(restaurant);
                    orderItem.setMenuItem(menuItem);
                    orderItem.setQuantity(item.quantity());
                    orderItem.setUnitPrice(menuItem.getPrice());
                    orderItem.setStatus(OrderItemStatus.NEW);
                    return orderItem;
                })
                .toList();

        orderItemRepository.saveAll(orderItems);

        logPotentialDuplicate(lastOrderBefore, request, menuItemMap);

        OrderResponse response = toOrderResponse(savedOrder);
        orderWebSocketPublisher.publishNewOrder(response, restaurant.getId());
        return response;
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getOrdersByTable(String restaurantCode, Long tableId) {
        Restaurant restaurant = getRestaurant(restaurantCode);
        RestaurantTable table = getTable(tableId, restaurant.getId());

        return orderRepository
                .findByRestaurantTableIdAndRestaurantIdOrderByCreatedAtDesc(table.getId(), restaurant.getId())
                .stream()
                .map(this::toOrderResponse)
                .toList();
    }

    @Transactional
    public OrderResponse updateOrderStatus(Long orderId, OrderStatus newStatus) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Order not found"));

        if (!isValidTransition(order.getStatus(), newStatus)) {
            throw new ConflictException("Invalid order status transition");
        }

        order.setStatus(newStatus);
        Order savedOrder = orderRepository.save(order);
        OrderResponse response = toOrderResponse(savedOrder);

        orderWebSocketPublisher.publishOrderStatusUpdate(
                response,
                savedOrder.getRestaurant().getId(),
                savedOrder.getRestaurantTable().getId());

        return response;
    }

    private Restaurant getRestaurant(String restaurantCode) {
        return restaurantRepository.findByRestaurantCode(restaurantCode)
                .orElseThrow(() -> new NotFoundException("Restaurant not found"));
    }

    private RestaurantTable getTable(Long tableId, Long restaurantId) {
        return restaurantTableRepository.findByIdAndRestaurantId(tableId, restaurantId)
                .orElseThrow(() -> new NotFoundException("Table not found"));
    }

    private Map<Long, MenuItem> loadMenuItems(Long restaurantId, List<CreateOrderItemRequest> items) {
        List<Long> menuItemIds = items.stream().map(CreateOrderItemRequest::menuItemId).toList();
        List<MenuItem> menuItems = menuItemRepository.findByRestaurantIdAndIdIn(restaurantId, menuItemIds);

        if (menuItems.size() != menuItemIds.size()) {
            throw new NotFoundException("Menu item not found");
        }

        Map<Long, MenuItem> menuItemMap = new HashMap<>();
        for (MenuItem menuItem : menuItems) {
            if (!menuItem.isAvailable()) {
                throw new IllegalArgumentException("Menu item unavailable");
            }
            menuItemMap.put(menuItem.getId(), menuItem);
        }

        return menuItemMap;
    }

    private BigDecimal calculateTotal(Map<Long, MenuItem> menuItemMap, List<CreateOrderItemRequest> items) {
        BigDecimal total = BigDecimal.ZERO;
        for (CreateOrderItemRequest item : items) {
            MenuItem menuItem = menuItemMap.get(item.menuItemId());
            BigDecimal lineTotal = menuItem.getPrice().multiply(BigDecimal.valueOf(item.quantity()));
            total = total.add(lineTotal);
        }
        return total;
    }

    private void logPotentialDuplicate(Optional<Order> lastOrderBefore,
            CreateOrderRequest request,
            Map<Long, MenuItem> menuItemMap) {
        if (lastOrderBefore.isEmpty()) {
            return;
        }

        Order lastOrder = lastOrderBefore.get();
        Instant now = Instant.now();
        if (lastOrder.getCreatedAt() == null || Duration.between(lastOrder.getCreatedAt(), now).abs()
                .compareTo(DUPLICATE_WINDOW) > 0) {
            return;
        }

        Map<Long, Integer> requestedItems = new HashMap<>();
        for (CreateOrderItemRequest item : request.items()) {
            requestedItems.merge(item.menuItemId(), item.quantity(), Integer::sum);
        }

        List<OrderItem> lastOrderItems = orderItemRepository.findByOrderId(lastOrder.getId());
        Map<Long, Integer> previousItems = new HashMap<>();
        for (OrderItem item : lastOrderItems) {
            previousItems.merge(item.getMenuItem().getId(), item.getQuantity(), Integer::sum);
        }

        if (requestedItems.equals(previousItems)) {
            logger.warn("Potential duplicate order within 5 seconds for table {}", request.tableId());
        }
    }

    private OrderResponse toOrderResponse(Order order) {
        List<OrderItem> items = orderItemRepository.findByOrderId(order.getId());
        List<OrderItemResponse> itemResponses = items.stream()
                .map(item -> new OrderItemResponse(
                        item.getId(),
                        item.getMenuItem().getId(),
                        item.getMenuItem().getName(),
                        item.getQuantity(),
                        item.getUnitPrice(),
                        item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity())),
                        item.getStatus()))
                .toList();

        return new OrderResponse(
                order.getId(),
                order.getRestaurant().getId(),
                order.getRestaurantTable().getId(),
                order.getStatus(),
                order.getTotalAmount(),
                order.getCreatedAt(),
                order.getUpdatedAt(),
                itemResponses);
    }

    private boolean isValidTransition(OrderStatus current, OrderStatus next) {
        if (current == next) {
            return true;
        }
        if (next == OrderStatus.CANCELED) {
            return true;
        }
        return switch (current) {
            case NEW -> next == OrderStatus.CONFIRMED;
            case CONFIRMED -> next == OrderStatus.PREPARING;
            case PREPARING -> next == OrderStatus.READY;
            case READY -> next == OrderStatus.SERVED;
            case SERVED -> next == OrderStatus.PAID;
            case PAID, CANCELED -> false;
        };
    }
}
