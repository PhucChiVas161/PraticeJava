package com.example.demo.controller;

import com.example.demo.dto.MenuResponse;
import com.example.demo.service.MenuService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/menu")
public class MenuController {

    private final MenuService menuService;

    public MenuController(MenuService menuService) {
        this.menuService = menuService;
    }

    @GetMapping
    public ResponseEntity<MenuResponse> getMenu(@RequestParam("restaurantCode") String restaurantCode) {
        return ResponseEntity.ok(menuService.getMenuByRestaurantCode(restaurantCode));
    }
}
