package com.example.demo.service;

import com.example.demo.dto.CallResponse;
import com.example.demo.dto.CreateCallRequest;
import com.example.demo.exception.NotFoundException;
import com.example.demo.model.CallRequest;
import com.example.demo.model.Restaurant;
import com.example.demo.model.RestaurantTable;
import com.example.demo.model.enums.CallRequestStatus;
import com.example.demo.repository.CallRequestRepository;
import com.example.demo.repository.RestaurantRepository;
import com.example.demo.repository.RestaurantTableRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CallRequestService {

    private final RestaurantRepository restaurantRepository;
    private final RestaurantTableRepository restaurantTableRepository;
    private final CallRequestRepository callRequestRepository;

    public CallRequestService(RestaurantRepository restaurantRepository,
            RestaurantTableRepository restaurantTableRepository,
            CallRequestRepository callRequestRepository) {
        this.restaurantRepository = restaurantRepository;
        this.restaurantTableRepository = restaurantTableRepository;
        this.callRequestRepository = callRequestRepository;
    }

    @Transactional
    public CallResponse createCall(CreateCallRequest request) {
        Restaurant restaurant = restaurantRepository.findByRestaurantCode(request.restaurantCode())
                .orElseThrow(() -> new NotFoundException("Restaurant not found"));
        RestaurantTable table = restaurantTableRepository.findByIdAndRestaurantId(request.tableId(), restaurant.getId())
                .orElseThrow(() -> new NotFoundException("Table not found"));

        CallRequest callRequest = new CallRequest();
        callRequest.setRestaurant(restaurant);
        callRequest.setRestaurantTable(table);
        callRequest.setType(request.type());
        callRequest.setStatus(CallRequestStatus.NEW);

        CallRequest saved = callRequestRepository.save(callRequest);
        return new CallResponse(saved.getId(), saved.getType(), saved.getStatus(), saved.getCreatedAt());
    }
}
