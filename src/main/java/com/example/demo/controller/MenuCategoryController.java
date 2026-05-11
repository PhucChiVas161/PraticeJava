package com.example.demo.controller;

import org.springframework.web.bind.annotation.*;

import com.example.demo.dto.MenuCategoryDto;
import com.example.demo.service.MenuService;

@RestController
@RequestMapping("/menu-category")
public class MenuCategoryController {

    private final MenuService menuService;

    public MenuCategoryController(MenuService menuService) {
        this.menuService = menuService;
    }

    @PostMapping
    public long addMenuCategory(@RequestParam("restaurantCode") String restaurantCode,
            @RequestBody MenuCategoryDto menuCategoryDto) {
        return menuService.addMenuCategory(restaurantCode, menuCategoryDto);
    }

    // @PutMapping
    // public void updateMenuCategory(@RequestParam("restaurantCode") String
    // restaurantCode,
    // @RequestParam("categoryId") long categoryId,
    // @RequestBody MenuCategoryDto menuCategoryDto) {
    // menuService.updateMenuCategory(restaurantCode, categoryId, menuCategoryDto);
    // }

    // @DeleteMapping
    // public void deleteMenuCategory(@RequestParam("restaurantCode") String
    // restaurantCode,
    // @RequestParam("categoryId") long categoryId) {
    // menuService.deleteMenuCategory(restaurantCode, categoryId);
    // }

}
