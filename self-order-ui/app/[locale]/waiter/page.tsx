"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { apiGet, apiPut } from "@/lib/api";
import { createStompClient, parseStompMessage } from "@/lib/websocket";
import type { MenuResponse, OrderResponse, OrderStatus } from "@/lib/types";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const statusTone: Record<OrderStatus, string> = {
    NEW: "bg-[#fff7ef] text-[#6b5f57] border-[#ffc107]",
    CONFIRMED: "bg-[#1b1a17] text-white",
    PREPARING: "bg-[#ff6b35] text-white",
    READY: "bg-[#265d97] text-white animate-pulse",
    SERVED: "bg-[#1f7a4a] text-white",
    PAID: "bg-[#4b4453] text-white",
    CANCELED: "bg-[#b00020] text-white",
};

export default function WaiterPage() {
    const searchParams = useSearchParams();
    const restaurantCode = searchParams.get("restaurantCode") ?? "";
    const t = useTranslations("waiter");
    const tOrder = useTranslations("order");
    const tCommon = useTranslations("common");

    const [orders, setOrders] = useState<OrderResponse[]>([]);
    const [activeTab, setActiveTab] = useState<"pending" | "ready" | "all">("pending");

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
            client.subscribe(`/topic/waiter/${restaurantId}`, (message) => {
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

    const filteredOrders = useMemo(() => {
        switch (activeTab) {
            case "pending":
                return orders.filter((o) => o.status === "NEW");
            case "ready":
                return orders.filter((o) => o.status === "READY");
            case "all":
            default:
                return orders;
        }
    }, [orders, activeTab]);

    const sortedOrders = useMemo(() => {
        return [...filteredOrders].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    }, [filteredOrders]);

    const getTableName = (tableId: number) => {
        return `${t("table")} ${tableId}`;
    };

    function formatMoney(lineTotal: string | number) {
        const amount = typeof lineTotal === "string" ? parseFloat(lineTotal) : lineTotal;
        return new Intl.NumberFormat(tCommon("locale"), {
            style: "currency",
            currency: tCommon("currency"),
        }).format(amount);
    }

    return (
        <div className="min-h-screen bg-linear-to-br from-orange-50 to-amber-50">
            <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
                <header className="flex flex-col gap-2 relative">
                    <span className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-600">
                        {t("subtitle")}
                    </span>
                    <h1 className="font-display text-3xl font-bold text-gray-900">{t("title")}</h1>
                    <p className="text-sm text-gray-600">
                        {t("restaurantCode")}: {restaurantCode || "--"}
                    </p>
                    <div className="absolute top-0 right-0">
                        <LanguageSwitcher />
                    </div>
                </header>

                {/* Tabs */}
                <div className="flex gap-2 border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab("pending")}
                        className={`px-4 py-2 text-sm font-medium transition-colors ${
                            activeTab === "pending"
                                ? "border-b-2 border-orange-500 text-orange-600"
                                : "text-gray-500 hover:text-gray-700"
                        }`}
                    >
                        {t("pendingConfirmation")} ({orders.filter((o) => o.status === "NEW").length})
                    </button>
                    <button
                        onClick={() => setActiveTab("ready")}
                        className={`px-4 py-2 text-sm font-medium transition-colors ${
                            activeTab === "ready"
                                ? "border-b-2 border-orange-500 text-orange-600"
                                : "text-gray-500 hover:text-gray-700"
                        }`}
                    >
                        {t("readyToServe")} ({orders.filter((o) => o.status === "READY").length})
                    </button>
                    <button
                        onClick={() => setActiveTab("all")}
                        className={`px-4 py-2 text-sm font-medium transition-colors ${
                            activeTab === "all"
                                ? "border-b-2 border-orange-500 text-orange-600"
                                : "text-gray-500 hover:text-gray-700"
                        }`}
                    >
                        {t("allOrders")}
                    </button>
                </div>

                {/* Orders Grid */}
                {sortedOrders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-12 shadow-sm">
                        <div className="text-6xl mb-4">🍽️</div>
                        <p className="text-lg text-gray-500">
                            {activeTab === "pending"
                                ? t("noPending")
                                : activeTab === "ready"
                                  ? t("noReady")
                                  : t("noOrders")}
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {sortedOrders.map((order) => (
                            <div
                                key={order.id}
                                className={`rounded-2xl bg-white p-6 shadow-sm transition-all hover:shadow-md ${
                                    order.status === "READY" ? "ring-2 ring-blue-500" : ""
                                }`}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className="font-semibold text-gray-900">
                                            #{order.id} - {getTableName(order.tableId)}
                                        </h3>
                                        <p className="text-xs text-gray-500">
                                            {new Date(order.createdAt).toLocaleTimeString()}
                                        </p>
                                    </div>
                                    <span
                                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                                            statusTone[order.status]
                                        }`}
                                    >
                                        {tOrder(`status.${order.status}`) || order.status}
                                    </span>
                                </div>

                                {/* Order Items */}
                                <div className="mb-4 space-y-2">
                                    {order.items.map((item) => (
                                        <div key={item.id} className="flex items-center justify-between text-sm">
                                            <span className="text-gray-700">
                                                {item.quantity}x {item.name}
                                            </span>
                                            <span className="text-gray-500">{formatMoney(item.lineTotal)}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Total */}
                                <div className="mb-4 flex items-center justify-between border-t pt-3">
                                    <span className="text-sm font-medium text-gray-900">{tOrder("total")}</span>
                                    <span className="text-lg font-bold text-orange-600">
                                        {formatMoney(order.totalAmount)}
                                    </span>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2">
                                    {order.status === "NEW" && (
                                        <button
                                            onClick={() =>
                                                updateStatusMutation.mutate({
                                                    orderId: order.id,
                                                    status: "CONFIRMED",
                                                })
                                            }
                                            disabled={updateStatusMutation.isPending}
                                            className="flex-1 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-green-700 disabled:opacity-50"
                                        >
                                            {t("confirmOrder")}
                                        </button>
                                    )}
                                    {order.status === "READY" && (
                                        <button
                                            onClick={() =>
                                                updateStatusMutation.mutate({
                                                    orderId: order.id,
                                                    status: "SERVED",
                                                })
                                            }
                                            disabled={updateStatusMutation.isPending}
                                            className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 disabled:opacity-50 animate-pulse"
                                        >
                                            🍽️ {t("markAsServed")}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
