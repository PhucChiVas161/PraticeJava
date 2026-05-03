"use client";

import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import type { MenuResponse } from "@/lib/types";

export default function AdminPage() {
    const searchParams = useSearchParams();
    const restaurantCode = searchParams.get("restaurantCode") ?? "";

    const menuQuery = useQuery({
        queryKey: ["menu", restaurantCode],
        queryFn: () => apiGet<MenuResponse>("/menu", { restaurantCode }),
        enabled: Boolean(restaurantCode),
    });

    return (
        <div className="page-gradient flex min-h-screen flex-col">
            <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-10">
                <header className="flex flex-col gap-2">
                    <span className="text-xs uppercase tracking-[0.3em] text-[#6b5f57]">Admin studio</span>
                    <h1 className="font-display text-3xl text-[#1b1a17]">Operations overview</h1>
                    <p className="text-sm text-[#6b5f57]">Restaurant code: {restaurantCode || "--"}</p>
                </header>

                {!restaurantCode ? (
                    <div className="glass-panel rounded-2xl p-6 text-sm text-[#6b5f57]">
                        Add <strong>restaurantCode</strong> in the URL to load your menu.
                    </div>
                ) : menuQuery.isLoading ? (
                    <div className="glass-panel rounded-2xl p-6 text-sm text-[#6b5f57]">Loading restaurant data...</div>
                ) : menuQuery.error ? (
                    <div className="glass-panel rounded-2xl border border-red-200 p-6 text-sm text-red-700">
                        {menuQuery.error instanceof Error ? menuQuery.error.message : "Unable to load data"}
                    </div>
                ) : (
                    <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
                        <section className="glass-panel rounded-2xl p-6">
                            <h2 className="font-display text-xl">Menu management</h2>
                            <p className="mt-2 text-sm text-[#6b5f57]">
                                Review menu categories and item availability. Use future admin endpoints to add or edit
                                items.
                            </p>
                            <div className="mt-4 space-y-4">
                                {menuQuery.data?.categories.map((category) => (
                                    <div key={category.id}>
                                        <h3 className="text-base font-semibold text-[#1b1a17]">{category.name}</h3>
                                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                                            {category.items.map((item) => (
                                                <div
                                                    key={item.id}
                                                    className="rounded-xl border border-[#e6d9cd] bg-white/70 p-3"
                                                >
                                                    <p className="text-sm font-semibold text-[#1b1a17]">{item.name}</p>
                                                    <p className="text-xs text-[#6b5f57]">
                                                        {item.available ? "Available" : "Unavailable"}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <aside className="flex flex-col gap-4">
                            <div className="glass-panel rounded-2xl p-6">
                                <h2 className="font-display text-xl">Table map</h2>
                                <p className="mt-2 text-sm text-[#6b5f57]">
                                    Table setup will appear here once table management endpoints are connected.
                                </p>
                            </div>
                            <div className="glass-panel rounded-2xl p-6">
                                <h2 className="font-display text-xl">Order snapshot</h2>
                                <p className="mt-2 text-sm text-[#6b5f57]">
                                    Order analytics will populate after kitchen reporting APIs are available.
                                </p>
                            </div>
                        </aside>
                    </div>
                )}
            </main>
        </div>
    );
}
