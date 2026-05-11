package com.example.demo.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.dto.MenuItemDto;
import com.example.demo.service.MenuService;

@RestController
@RequestMapping("/menu-item")
public class MenuItemController {
    private final MenuService menuService;

    public MenuItemController(MenuService menuService) {
        this.menuService = menuService;
    }

    @PostMapping
    public ResponseEntity<Long> addMenuItem(
            @RequestParam("restaurantCode") String restaurantCode,
            @RequestBody MenuItemDto menuItemDto) {

        return ResponseEntity.ok(
                menuService.addMenuItem(restaurantCode, menuItemDto));
    }

    @DeleteMapping
    public ResponseEntity<Long> deleteMenuItem(@RequestParam("restaurantCode") String restaurantCode,
            @RequestParam(value = "menuItemId", required = true) Long menuItemId) {
        return ResponseEntity.ok(menuService.deleteMenuItemById(restaurantCode, menuItemId));
    }
}
