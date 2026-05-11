"use client";

import { useMemo, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import {
    OrderStatus,
    type CallRequestType,
    type CreateOrderRequest,
    type MenuItem,
    type MenuResponse,
    type OrderResponse,
} from "@/lib/types";
import { apiGet, apiPost } from "@/lib/api";
import { createStompClient, parseStompMessage } from "@/lib/websocket";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const statusLabels: Record<string, string> = {
    NEW: "Order received",
    CONFIRMED: "Accepted by restaurant",
    PREPARING: "Cooking now",
    READY: "Ready for pickup",
    SERVED: "Delivered to table",
    PAID: "Paid",
    CANCELED: "Canceled",
};

type CartLine = {
    item: MenuItem;
    quantity: number;
};

function formatMoney(value: string | number) {
    const amount = typeof value === "string" ? Number(value) : value;
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    }).format(amount);
}

export default function OrderPage() {
    const searchParams = useSearchParams();
    const restaurantCode = searchParams.get("restaurantCode") ?? "";
    const tableIdValue = searchParams.get("tableId") ?? "";
    const tableId = Number(tableIdValue);
    const t = useTranslations("order");
    const tCommon = useTranslations("common");

    const [cart, setCart] = useState<Record<string, CartLine>>({});
    const [latestOrder, setLatestOrder] = useState<OrderResponse | null>(null);
    const [orderUpdates, setOrderUpdates] = useState<OrderResponse[]>([]);

    const menuQuery = useQuery({
        queryKey: ["menu", restaurantCode],
        queryFn: () => apiGet<MenuResponse>("/menu", { restaurantCode }),
        enabled: Boolean(restaurantCode),
    });

    const addToCart = (item: MenuItem) => {
        setCart((current) => {
            const key = String(item.id);
            const existing = current[key];
            return {
                ...current,
                [key]: {
                    item,
                    quantity: existing ? existing.quantity + 1 : 1,
                },
            };
        });
    };

    const removeFromCart = (itemId: number) => {
        setCart((current) => {
            const next = { ...current };
            delete next[String(itemId)];
            return next;
        });
    };

    const changeQuantity = (itemId: number, delta: number) => {
        setCart((current) => {
            const key = String(itemId);
            const existing = current[key];
            if (!existing) {
                return current;
            }
            const nextQuantity = existing.quantity + delta;
            if (nextQuantity <= 0) {
                const next = { ...current };
                delete next[key];
                return next;
            }
            return {
                ...current,
                [key]: { ...existing, quantity: nextQuantity },
            };
        });
    };

    const cartItems = useMemo(() => Object.values(cart), [cart]);
    const cartTotal = useMemo(() => {
        return cartItems.reduce((total, line) => {
            const price = typeof line.item.price === "string" ? Number(line.item.price) : line.item.price;
            return total + price * line.quantity;
        }, 0);
    }, [cartItems]);

    const placeOrderMutation = useMutation({
        mutationFn: async () => {
            if (!restaurantCode || !tableId || cartItems.length === 0) {
                throw new Error("Missing order details");
            }

            const payload: CreateOrderRequest = {
                restaurantCode,
                tableId,
                idempotencyKey: crypto.randomUUID(),
                items: cartItems.map((line) => ({
                    menuItemId: line.item.id,
                    quantity: line.quantity,
                })),
            };

            return apiPost<OrderResponse, CreateOrderRequest>("/orders", payload);
        },
        onSuccess: (response) => {
            setLatestOrder(response);
            setOrderUpdates((current) => [response, ...current]);
            setCart({});
        },
    });

    const callMutation = useMutation({
        mutationFn: (type: CallRequestType) => apiPost("/call", { restaurantCode, tableId, type }),
    });

    useEffect(() => {
        const restaurantId = menuQuery.data?.restaurantId;
        if (!restaurantId || !tableId) {
            return;
        }

        const client = createStompClient(() => {
            client.subscribe(`/topic/table/${restaurantId}/${tableId}`, (message) => {
                const payload = parseStompMessage<OrderResponse>(message);
                if (!payload) {
                    return;
                }
                setLatestOrder(payload);
                setOrderUpdates((current) => [payload, ...current]);
            });
        });

        client.activate();
        return () => {
            void client.deactivate();
        };
    }, [menuQuery.data?.restaurantId, tableId]);

    const latestStatusLabel = latestOrder ? (statusLabels[latestOrder.status] ?? latestOrder.status) : null;

    const statusTextMap = t("orderStatus");

    return (
        <div className="page-gradient flex min-h-screen flex-col">
            <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-10 lg:grid lg:grid-cols-[1.2fr_0.8fr]">
                <section className="flex flex-col gap-6">
                    <header className="flex flex-col gap-2 relative">
                        <span className="text-xs uppercase tracking-[0.3em] text-[#6b5f57]">{t("tableService")}</span>
                        <h1 className="font-display text-3xl text-[#1b1a17]">{t("title")}</h1>
                        <p className="text-sm text-[#6b5f57]">
                            {t("restaurant")}: {restaurantCode || "--"} | {t("table")}: {tableIdValue || "--"}
                        </p>
                        <div className="absolute top-0 right-0">
                            <LanguageSwitcher />
                        </div>
                    </header>

                    {!restaurantCode || !tableId ? (
                        <div className="glass-panel rounded-2xl p-6 text-sm text-[#6b5f57]">
                            {t("addRestaurantCode")} <strong>restaurantCode</strong> {t("and")} <strong>tableId</strong>{" "}
                            {t("toStartOrder")}
                        </div>
                    ) : menuQuery.isLoading ? (
                        <div className="glass-panel rounded-2xl p-6 text-sm text-[#6b5f57]">
                            {tCommon("loading")}...
                        </div>
                    ) : menuQuery.error ? (
                        <div className="glass-panel rounded-2xl border border-red-200 p-6 text-sm text-red-700">
                            {menuQuery.error instanceof Error ? menuQuery.error.message : t("unableToLoadMenu")}
                        </div>
                    ) : (
                        <div className="flex flex-col gap-6">
                            {menuQuery.data?.categories.map((category) => (
                                <div key={category.id} className="flex flex-col gap-3">
                                    <h2 className="font-display text-xl text-[#1b1a17]">{category.name}</h2>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        {category.items.map((item) => (
                                            <div
                                                key={item.id}
                                                className="glass-panel flex flex-col gap-3 rounded-2xl p-4"
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <h3 className="text-base font-semibold text-[#1b1a17]">
                                                            {item.name}
                                                        </h3>
                                                        <p className="text-xs text-[#6b5f57]">
                                                            {item.description || t("seasonalFavorite")}
                                                        </p>
                                                    </div>
                                                    <span className="text-sm font-semibold text-[#265d97]">
                                                        {formatMoney(item.price)}
                                                    </span>
                                                </div>
                                                <button
                                                    className="mt-auto inline-flex items-center justify-center rounded-full bg-[#1b1a17] px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                                                    onClick={() => addToCart(item)}
                                                    disabled={!item.available}
                                                >
                                                    {item.available ? t("addToCart") : t("unavailable")}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                <aside className="flex flex-col gap-4 lg:sticky lg:top-6 lg:self-start">
                    <div className="glass-panel rounded-2xl p-5">
                        <h2 className="font-display text-xl">{t("yourCart")}</h2>
                        {cartItems.length === 0 ? (
                            <p className="mt-3 text-sm text-[#6b5f57]">{t("addItems")}</p>
                        ) : (
                            <div className="mt-4 flex flex-col gap-3">
                                {cartItems.map((line) => (
                                    <div key={line.item.id} className="flex items-center gap-3">
                                        <div className="flex-1">
                                            <p className="text-sm font-semibold text-[#1b1a17]">{line.item.name}</p>
                                            <p className="text-xs text-[#6b5f57]">
                                                {formatMoney(line.item.price)} {t("each")}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                className="h-7 w-7 rounded-full border border-[#e6d9cd] text-sm"
                                                onClick={() => changeQuantity(line.item.id, -1)}
                                            >
                                                -
                                            </button>
                                            <span className="text-sm font-semibold">{line.quantity}</span>
                                            <button
                                                className="h-7 w-7 rounded-full border border-[#e6d9cd] text-sm"
                                                onClick={() => changeQuantity(line.item.id, 1)}
                                            >
                                                +
                                            </button>
                                        </div>
                                        <button
                                            className="text-xs text-[#6b5f57]"
                                            onClick={() => removeFromCart(line.item.id)}
                                        >
                                            {t("remove")}
                                        </button>
                                    </div>
                                ))}

                                <div className="flex items-center justify-between border-t border-[#e6d9cd] pt-3 text-sm">
                                    <span className="text-[#6b5f57]">{t("total")}</span>
                                    <span className="font-semibold text-[#1b1a17]">{formatMoney(cartTotal)}</span>
                                </div>
                            </div>
                        )}

                        <button
                            className="mt-4 w-full rounded-full bg-[#ff6b35] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-95 disabled:opacity-50"
                            disabled={placeOrderMutation.isPending || cartItems.length === 0}
                            onClick={() => placeOrderMutation.mutate()}
                        >
                            {placeOrderMutation.isPending ? t("placing") : t("placeOrder")}
                        </button>

                        {placeOrderMutation.error ? (
                            <p className="mt-2 text-xs text-red-700">
                                {placeOrderMutation.error instanceof Error
                                    ? placeOrderMutation.error.message
                                    : t("orderFailed")}
                            </p>
                        ) : null}
                    </div>

                    <div className="glass-panel rounded-2xl p-5">
                        <h2 className="font-display text-xl">{t("serviceRequests")}</h2>
                        <p className="mt-2 text-xs text-[#6b5f57]">{t("needHelp")}</p>
                        <div className="mt-4 flex gap-2">
                            <button
                                className="flex-1 rounded-full border border-[#1b1a17] px-3 py-2 text-xs font-semibold text-[#1b1a17]"
                                onClick={() => callMutation.mutate("CALL")}
                                disabled={callMutation.isPending}
                            >
                                {t("callStaff")}
                            </button>
                            <button
                                className="flex-1 rounded-full border border-[#265d97] px-3 py-2 text-xs font-semibold text-[#265d97]"
                                onClick={() => callMutation.mutate("WATER")}
                                disabled={callMutation.isPending}
                            >
                                {t("callWater")}
                            </button>
                            <button
                                className="flex-1 rounded-full border border-[#265d97] px-3 py-2 text-xs font-semibold text-[#265d97]"
                                onClick={() => callMutation.mutate("PAY")}
                                disabled={callMutation.isPending}
                            >
                                {t("callBill")}
                            </button>
                        </div>
                        {callMutation.error ? (
                            <p className="mt-2 text-xs text-red-700">
                                {callMutation.error instanceof Error ? callMutation.error.message : t("requestFailed")}
                            </p>
                        ) : null}
                    </div>

                    <div className="glass-panel rounded-2xl p-5">
                        <h2 className="font-display text-xl">{statusTextMap}</h2>
                        {latestOrder ? (
                            <div className="mt-3 flex flex-col gap-2 text-sm">
                                <span className="inline-flex w-fit items-center rounded-full bg-[#1b1a17] px-3 py-1 text-xs font-semibold text-white">
                                    {latestStatusLabel}
                                </span>
                                <p className="text-xs text-[#6b5f57]">
                                    #{latestOrder.id} • {latestOrder.items.length} {t("items").toLowerCase()}
                                </p>
                            </div>
                        ) : (
                            <p className="mt-3 text-xs text-[#6b5f57]">{t("placeOrderToSeeUpdates")}</p>
                        )}
                        {orderUpdates.length > 0 ? (
                            <div className="mt-4 max-h-40 space-y-2 overflow-auto text-xs text-[#6b5f57]">
                                {orderUpdates.slice(0, 5).map((order) => (
                                    <div key={`${order.id}-${order.updatedAt}`}>
                                        #{order.id} {t("updatedTo")} {statusLabels[order.status]}
                                    </div>
                                ))}
                            </div>
                        ) : null}
                    </div>
                </aside>
            </main>
        </div>
    );
}
