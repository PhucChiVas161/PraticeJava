// package com.example.demo;

// import com.example.demo.dto.MenuCategoryDto;
// import com.example.demo.dto.MenuItemDto;
// import com.example.demo.dto.MenuResponse;
// import com.example.demo.service.MenuService;
// import org.junit.jupiter.api.Test;
// import org.springframework.beans.factory.annotation.Autowired;
// import
// org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
// import org.springframework.boot.test.context.SpringBootTest;
// import org.springframework.boot.test.mock.mockito.MockBean;
// import org.springframework.test.web.servlet.MockMvc;

// import java.math.BigDecimal;
// import java.util.List;

// import static org.mockito.Mockito.when;
// import static
// org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
// import static
// org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
// import static
// org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// @SpringBootTest
// @AutoConfigureMockMvc
// class MenuControllerIntegrationTest {

// @Autowired
// private MockMvc mockMvc;

// @MockBean
// private MenuService menuService;

// @Test
// void getMenuReturnsRestaurantPayload() throws Exception {
// MenuItemDto item = new MenuItemDto(10L, "Pasta", "Fresh pasta", new
// BigDecimal("12.50"), true);
// MenuCategoryDto category = new MenuCategoryDto(1L, "Mains", 1,
// List.of(item));
// MenuResponse response = new MenuResponse(5L, "ABC123", "Demo Restaurant",
// List.of(category));

// when(menuService.getMenuByRestaurantCode("ABC123")).thenReturn(response);

// mockMvc.perform(get("/api/v1/menu").param("restaurantCode", "ABC123"))
// .andExpect(status().isOk())
// .andExpect(jsonPath("$.restaurantCode").value("ABC123"))
// .andExpect(jsonPath("$.categories[0].items[0].name").value("Pasta"));
// }
// }
