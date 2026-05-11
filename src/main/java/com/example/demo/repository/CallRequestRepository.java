package com.example.demo.repository;

import com.example.demo.model.CallRequest;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CallRequestRepository extends JpaRepository<CallRequest, Long> {
}
