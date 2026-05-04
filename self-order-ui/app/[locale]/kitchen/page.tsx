"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { apiGet, apiPut } from "@/lib/api";
import { createStompClient, parseStompMessage } from "@/lib/websocket";
import type { MenuResponse, OrderResponse, OrderStatus } from "@/lib/types";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const nextStatusMap: Record<OrderStatus, OrderStatus | null> = {
    NEW: "CONFIRMED",
    CONFIRMED: "PREPARING",
    PREPARING: "READY",
    READY: "SERVED",
    SERVED: "PAID",
    PAID: null,
    CANCELED: null,
};

const statusTone: Record<OrderStatus, string> = {
    NEW: "bg-[#fff7ef] text-[#6b5f57]",
    CONFIRMED: "bg-[#1b1a17] text-white",
    PREPARING: "bg-[#ff6b35] text-white",
    READY: "bg-[#265d97] text-white animate-pulse",
    SERVED: "bg-[#1f7a4a] text-white",
    PAID: "bg-[#4b4453] text-white",
    CANCELED: "bg-[#b00020] text-white",
};

const statusLabel: Record<OrderStatus, string> = {
    NEW: "Mới",
    CONFIRMED: "Đã xác nhận",
    PREPARING: "Đang chế biến",
    READY: "Sẵn sàng - Đã báo phục vụ",
    SERVED: "Đã phục vụ",
    PAID: "Đã thanh toán",
    CANCELED: "Đã hủy",
};

function formatMoney(value: string | number) {
    const amount = typeof value === "string" ? Number(value) : value;
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    }).format(amount);
}

export default function KitchenPage() {
    const searchParams = useSearchParams();
    const restaurantCode = searchParams.get("restaurantCode") ?? "";
    const t = useTranslations("kitchen");
    const tOrder = useTranslations("order");
    const tCommon = useTranslations("common");

    const statusTextMap = tOrder("status") as unknown as Record<OrderStatus, string>;

    const [orders, setOrders] = useState<OrderResponse[]>([]);

    const menuQuery = useQuery({
        queryKey: ["menu", restaurantCode],
        queryFn: () => apiGet<MenuResponse>("/menu", { restaurantCode }),
        enabled: Boolean(restaurantCode),
    });

    const updateStatusMutation = useMutation({
        mutationFn: (payload: { orderId: number; status: OrderStatus }) =>
            apiPut<OrderResponse, { status: OrderStatus }>(`/orders/${payload.orderId}/status`, {
                status: payload.status,
            }),
        onSuccess: (updated) => {
            setOrders((current) => current.map((order) => (order.id === updated.id ? updated : order)));
        },
    });

    useEffect(() => {
        const restaurantId = menuQuery.data?.restaurantId;
        if (!restaurantId) {
            return;
        }

        const client = createStompClient(() => {
            client.subscribe(`/topic/kitchen/${restaurantId}`, (message) => {
                const payload = parseStompMessage<OrderResponse>(message);
                if (!payload) {
                    return;
                }
                setOrders((current) => {
                    const existingIndex = current.findIndex((order) => order.id === payload.id);
                    if (existingIndex === -1) {
                        return [payload, ...current];
                    }
                    return current.map((order) => (order.id === payload.id ? payload : order));
                });
            });
        });

        client.activate();
        return () => {
            void client.deactivate();
        };
    }, [menuQuery.data?.restaurantId]);

    const sortedOrders = useMemo(() => {
        return [...orders].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    }, [orders]);

    return (
        <div className="page-gradient flex min-h-screen flex-col">
            <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-10">
                <header className="flex flex-col gap-2 relative">
                    <span className="text-xs uppercase tracking-[0.3em] text-[#6b5f57]">{t("subtitle")}</span>
                    <h1 className="font-display text-3xl text-[#1b1a17]">{t("title")}</h1>
                    <p className="text-sm text-[#6b5f57]">
                        {t("restaurantCode")}: {restaurantCode || "--"}
                    </p>
                    <div className="absolute top-0 right-0">
                        <LanguageSwitcher />
                    </div>
                </header>

                {!restaurantCode ? (
                    <div className="glass-panel rounded-2xl p-6 text-sm text-[#6b5f57]">{t("addRestaurantCode")}</div>
                ) : menuQuery.isLoading ? (
                    <div className="glass-panel rounded-2xl p-6 text-sm text-[#6b5f57]">{t("connecting")}</div>
                ) : menuQuery.error ? (
                    <div className="glass-panel rounded-2xl border border-red-200 p-6 text-sm text-red-700">
                        {menuQuery.error instanceof Error ? menuQuery.error.message : t("unableToConnect")}
                    </div>
                ) : (
                    <div className="grid gap-4 lg:grid-cols-2">
                        {sortedOrders.length === 0 ? (
                            <div className="glass-panel rounded-2xl p-6 text-sm text-[#6b5f57]">{t("waiting")}</div>
                        ) : (
                            sortedOrders.map((order) => {
                                const nextStatus = nextStatusMap[order.status];
                                return (
                                    <div key={order.id} className="glass-panel rounded-2xl p-5">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h2 className="font-display text-xl">
                                                    {tOrder("title")} #{order.id}
                                                </h2>
                                                <p className="text-xs text-[#6b5f57]">
                                                    {t("table")} {order.tableId} • {order.items.length}{" "}
                                                    {t("items").toLowerCase()}
                                                </p>
                                            </div>
                                            <span
                                                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                                                    statusTone[order.status]
                                                }`}
                                            >
                                                {statusTextMap[order.status] || order.status}
                                            </span>
                                        </div>

                                        <div className="mt-4 space-y-2 text-sm">
                                            {order.items.map((item) => (
                                                <div key={item.id} className="flex justify-between">
                                                    <span>
                                                        {item.quantity}x {item.name}
                                                    </span>
                                                    <span className="text-xs text-[#6b5f57]">
                                                        {item.status ?? statusTextMap["NEW"]}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="mt-4 flex items-center justify-between">
                                            <span className="text-xs text-[#6b5f57]">
                                                {t("total")}: {formatMoney(order.totalAmount)}
                                            </span>
                                            {nextStatus ? (
                                                <button
                                                    className="rounded-full bg-[#1b1a17] px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                                                    onClick={() =>
                                                        updateStatusMutation.mutate({
                                                            orderId: order.id,
                                                            status: nextStatus,
                                                        })
                                                    }
                                                    disabled={updateStatusMutation.isPending}
                                                >
                                                    {t("moveTo")}{" "}
                                                    {statusTextMap[nextStatus as OrderStatus] || nextStatus}
                                                </button>
                                            ) : (
                                                <span className="text-xs text-[#6b5f57]">{t("statusLocked")}</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
