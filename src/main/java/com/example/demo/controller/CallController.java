package com.example.demo.controller;

import com.example.demo.dto.CallResponse;
import com.example.demo.dto.CreateCallRequest;
import com.example.demo.service.CallRequestService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/call")
public class CallController {

    private final CallRequestService callRequestService;

    public CallController(CallRequestService callRequestService) {
        this.callRequestService = callRequestService;
    }

    @PostMapping
    public ResponseEntity<CallResponse> createCall(@Valid @RequestBody CreateCallRequest request) {
        CallResponse response = callRequestService.createCall(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
