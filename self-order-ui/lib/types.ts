export type MenuItem = {
    id: number;
    name: string;
    description?: string | null;
    price: string | number;
    available: boolean;
};

export type MenuCategory = {
    id: number;
    name: string;
    sortOrder: number;
    items: MenuItem[];
};

export type MenuResponse = {
    restaurantId: number;
    restaurantCode: string;
    restaurantName: string;
    categories: MenuCategory[];
};

export type OrderStatus = "NEW" | "CONFIRMED" | "PREPARING" | "READY" | "SERVED" | "PAID" | "CANCELED";

// Waiter specific status flow: NEW -> CONFIRMED (waiter confirms) -> PREPARING -> READY (notify waiter) -> SERVED (waiter delivers)

export type OrderItemStatus = "NEW" | "PREPARING" | "READY" | "SERVED" | "CANCELED";

export type OrderItemResponse = {
    id: number;
    menuItemId: number;
    name: string;
    quantity: number;
    unitPrice: string | number;
    lineTotal: string | number;
    status?: OrderItemStatus | null;
};

export type OrderResponse = {
    id: number;
    restaurantId: number;
    tableId: number;
    status: OrderStatus;
    totalAmount: string | number;
    createdAt: string;
    updatedAt: string;
    items: OrderItemResponse[];
};

export type CreateOrderItemRequest = {
    menuItemId: number;
    quantity: number;
};

export type CreateOrderRequest = {
    restaurantCode: string;
    tableId: number;
    idempotencyKey: string;
    items: CreateOrderItemRequest[];
};

export type CallRequestType = "CALL" | "PAY";

export type CallResponse = {
    id: number;
    type: CallRequestType;
    status: "NEW" | "HANDLED";
    createdAt: string;
};
