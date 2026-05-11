package com.example.demo.repository;

import com.example.demo.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    // Find users by name
    List<User> findByName(String name);

    // Find users by email
    Optional<User> findByEmail(String email);

    // Find users older than a certain age
    List<User> findByAgeGreaterThan(int age);

    // Find users younger than a certain age
    List<User> findByAgeLessThan(int age);

    // Find users by name and age
    List<User> findByNameAndAge(String name, int age);
}