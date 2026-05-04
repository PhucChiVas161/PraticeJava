"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";
import type { MenuResponse, MenuItem } from "@/lib/types";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function AdminPage() {
    const searchParams = useSearchParams();
    const restaurantCode = searchParams.get("restaurantCode") ?? "";
    const t = useTranslations("admin");
    const tCommon = useTranslations("common");

    const [activeTab, setActiveTab] = useState<"menu" | "tables" | "orders" | "stats">("menu");
    const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
    const [showItemModal, setShowItemModal] = useState(false);
    const [showTableModal, setShowTableModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<{ id: number; name: string } | null>(null);
    const [showCategoryModal, setShowCategoryModal] = useState(false);

    const menuQuery = useQuery({
        queryKey: ["menu", restaurantCode],
        queryFn: () => apiGet<MenuResponse>("/menu", { restaurantCode }),
        enabled: Boolean(restaurantCode),
    });

    const [newItem, setNewItem] = useState({
        name: "",
        description: "",
        price: "",
        categoryId: "",
        available: true,
    });

    const addItemMutation = useMutation({
        mutationFn: (item: typeof newItem) => apiPost(`/menu-item?restaurantCode=${restaurantCode}`, item),
        onSuccess: () => {
            menuQuery.refetch();
            setShowItemModal(false);
            setNewItem({ name: "", description: "", price: "", categoryId: "", available: true });
        },
    });

    const updateItemMutation = useMutation({
        mutationFn: (item: MenuItem) =>
            apiPut(`/menu-item?restaurantCode=${restaurantCode}&menuItemId=${item.id}`, item),
        onSuccess: () => {
            menuQuery.refetch();
            setShowItemModal(false);
            setEditingItem(null);
        },
    });

    const deleteItemMutation = useMutation({
        mutationFn: (itemId: number) => apiDelete(`/menu-item?restaurantCode=${restaurantCode}&menuItemId=${itemId}`),
        onSuccess: () => menuQuery.refetch(),
    });

    const [newCategory, setNewCategory] = useState({ name: "" });

    const addCategoryMutation = useMutation({
        mutationFn: (category: typeof newCategory) =>
            apiPost(`/menu-category?restaurantCode=${restaurantCode}`, category),
        onSuccess: () => {
            menuQuery.refetch();
            setShowCategoryModal(false);
            setNewCategory({ name: "" });
        },
    });

    const updateCategoryMutation = useMutation({
        mutationFn: (category: { id: number; name: string }) =>
            apiPut(`/menu-category?restaurantCode=${restaurantCode}&categoryId=${category.id}`, {
                name: category.name,
            }),
        onSuccess: () => {
            menuQuery.refetch();
            setShowCategoryModal(false);
            setEditingCategory(null);
        },
    });

    const deleteCategoryMutation = useMutation({
        mutationFn: (categoryId: number) =>
            apiDelete(`/menu-category?restaurantCode=${restaurantCode}&categoryId=${categoryId}`),
        onSuccess: () => menuQuery.refetch(),
    });

    return (
        <div className="page-gradient flex min-h-screen flex-col">
            <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-6 py-10">
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
                    <div className="glass-panel rounded-2xl p-6 text-sm text-[#6b5f57]">
                        <strong>restaurantCode</strong> {t("addRestaurantCode")}
                    </div>
                ) : menuQuery.isLoading ? (
                    <div className="glass-panel rounded-2xl p-6 text-sm text-[#6b5f57]">{t("loading")}</div>
                ) : menuQuery.error ? (
                    <div className="glass-panel rounded-2xl border border-red-200 p-6 text-sm text-red-700">
                        {menuQuery.error instanceof Error ? menuQuery.error.message : t("errorLoading")}
                    </div>
                ) : (
                    <>
                        {/* Tabs */}
                        <div className="flex gap-2 border-b border-[#e6d9cd]">
                            {(["menu", "tables", "orders", "stats"] as const).map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                                        activeTab === tab
                                            ? "border-b-2 border-[#ff6b35] text-[#ff6b35]"
                                            : "text-[#6b5f57] hover:text-[#1b1a17]"
                                    }`}
                                >
                                    {t(tab)}
                                </button>
                            ))}
                        </div>

                        {/* Menu Management Tab */}
                        {activeTab === "menu" && (
                            <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
                                <section className="glass-panel rounded-2xl p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="font-display text-xl">{t("menuManagement")}</h2>
                                        <button
                                            onClick={() => {
                                                setEditingItem(null);
                                                setShowItemModal(true);
                                            }}
                                            className="rounded-full bg-[#ff6b35] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-95"
                                        >
                                            + {t("addItem")}
                                        </button>
                                    </div>
                                    <p className="mb-4 text-sm text-[#6b5f57]">{t("menuDescription")}</p>
                                    <div className="space-y-4">
                                        {menuQuery.data?.categories.map((category) => (
                                            <div key={category.id}>
                                                <h3 className="text-base font-semibold text-[#1b1a17]">
                                                    {category.name} ({category.items.length} {t("items").toLowerCase()})
                                                </h3>
                                                <div className="mt-2 space-y-2">
                                                    {category.items.map((item) => (
                                                        <div
                                                            key={item.id}
                                                            className="flex items-center justify-between rounded-xl border border-[#e6d9cd] bg-white/70 p-3"
                                                        >
                                                            <div className="flex-1">
                                                                <p className="text-sm font-semibold text-[#1b1a17]">
                                                                    {item.name}
                                                                </p>
                                                                <p className="text-xs text-[#6b5f57]">
                                                                    {item.description || t("noDescription")}
                                                                </p>
                                                                <p className="text-xs font-semibold text-[#265d97] mt-1">
                                                                    $
                                                                    {typeof item.price === "string"
                                                                        ? item.price
                                                                        : item.price.toFixed(2)}
                                                                </p>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span
                                                                    className={`rounded-full px-2 py-1 text-xs ${
                                                                        item.available
                                                                            ? "bg-green-100 text-green-700"
                                                                            : "bg-red-100 text-red-700"
                                                                    }`}
                                                                >
                                                                    {item.available ? t("available") : t("unavailable")}
                                                                </span>
                                                                <button
                                                                    onClick={() => {
                                                                        setEditingItem(item);
                                                                        setShowItemModal(true);
                                                                    }}
                                                                    className="text-xs text-[#265d97] hover:underline"
                                                                >
                                                                    {tCommon("edit")}
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        if (confirm(t("deleteConfirm"))) {
                                                                            deleteItemMutation.mutate(item.id);
                                                                        }
                                                                    }}
                                                                    className="text-xs text-red-600 hover:underline"
                                                                >
                                                                    {tCommon("delete")}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                <aside className="flex flex-col gap-4">
                                    <div className="glass-panel rounded-2xl p-6">
                                        <div className="flex justify-between items-center">
                                            <h3 className="font-display text-lg">{t("categories")}</h3>
                                            <button
                                                onClick={() => {
                                                    setEditingCategory(null);
                                                    setShowCategoryModal(true);
                                                }}
                                                className="rounded-full bg-[#ff6b35] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-95"
                                            >
                                                + {t("addCategory")}
                                            </button>
                                        </div>
                                        <div className="mt-3 space-y-2">
                                            {menuQuery.data?.categories.map((cat) => (
                                                <div
                                                    key={cat.id}
                                                    className="flex items-center justify-between rounded-lg bg-white/50 p-2"
                                                >
                                                    <span className="text-sm text-[#1b1a17]">{cat.name}</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs text-[#6b5f57]">
                                                            {cat.items.length} {t("items").toLowerCase()}
                                                        </span>
                                                        <button
                                                            onClick={() => {
                                                                setEditingCategory({ id: cat.id, name: cat.name });
                                                                setShowCategoryModal(true);
                                                            }}
                                                            className="text-xs text-[#265d97] hover:underline"
                                                        >
                                                            {tCommon("edit")}
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                if (confirm(t("deleteConfirm"))) {
                                                                    deleteCategoryMutation.mutate(cat.id);
                                                                }
                                                            }}
                                                            className="text-xs text-red-600 hover:underline"
                                                        >
                                                            {tCommon("delete")}
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="glass-panel rounded-2xl p-6">
                                        <h3 className="font-display text-lg">{t("orderSnapshot")}</h3>
                                        <p className="mt-2 text-sm text-[#6b5f57]">{t("orderSnapshotDescription")}</p>
                                    </div>
                                </aside>
                            </div>
                        )}

                        {/* Tables Management Tab */}
                        {activeTab === "tables" && (
                            <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
                                <section className="glass-panel rounded-2xl p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="font-display text-xl">{t("tables")}</h2>
                                        <button
                                            onClick={() => setShowTableModal(true)}
                                            className="rounded-full bg-[#ff6b35] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-95"
                                        >
                                            + {t("addTable")}
                                        </button>
                                    </div>
                                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((tableNum) => (
                                            <div
                                                key={tableNum}
                                                className="rounded-xl border border-[#e6d9cd] bg-white/70 p-4"
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <h3 className="font-semibold text-[#1b1a17]">
                                                        {t("tableNumber")} {tableNum}
                                                    </h3>
                                                    <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-700">
                                                        {t("active")}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-[#6b5f57]">
                                                    {t("seats")}: 4 • {t("status")}: {t("active")}
                                                </p>
                                                <div className="mt-3 flex gap-2">
                                                    <button className="text-xs text-[#265d97] hover:underline">
                                                        {t("editTable")}
                                                    </button>
                                                    <button className="text-xs text-red-600 hover:underline">
                                                        {t("deleteTable")}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                <aside className="flex flex-col gap-4">
                                    <div className="glass-panel rounded-2xl p-6">
                                        <h3 className="font-display text-lg">
                                            {t("tables")} {t("statistics")}
                                        </h3>
                                        <div className="mt-3 space-y-3">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-[#6b5f57]">{t("totalOrders")}</span>
                                                <span className="font-semibold">10</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-[#6b5f57]">{t("active")}</span>
                                                <span className="font-semibold text-green-600">8</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-[#6b5f57]">{t("inactive")}</span>
                                                <span className="font-semibold text-red-600">2</span>
                                            </div>
                                        </div>
                                    </div>
                                </aside>
                            </div>
                        )}

                        {/* Orders Tab */}
                        {activeTab === "orders" && (
                            <div className="glass-panel rounded-2xl p-6">
                                <h2 className="font-display text-xl mb-4">{t("orders")}</h2>
                                <div className="space-y-3">
                                    {[1, 2, 3].map((orderId) => (
                                        <div
                                            key={orderId}
                                            className="rounded-xl border border-[#e6d9cd] bg-white/70 p-4"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h3 className="font-semibold text-[#1b1a17]">
                                                        #{orderId} - {t("table")} {orderId}
                                                    </h3>
                                                    <p className="text-xs text-[#6b5f57]">
                                                        {t("items")}: 3 • ${25.99}
                                                    </p>
                                                </div>
                                                <span className="rounded-full bg-[#ff6b35] px-3 py-1 text-xs font-semibold text-white">
                                                    {t("status")}: PREPARING
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Statistics Tab */}
                        {activeTab === "stats" && (
                            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                                <div className="glass-panel rounded-2xl p-6">
                                    <h3 className="text-sm font-medium text-[#6b5f57]">
                                        {t("totalOrders")} ({t("today")})
                                    </h3>
                                    <p className="mt-2 font-display text-3xl text-[#1b1a17]">24</p>
                                </div>
                                <div className="glass-panel rounded-2xl p-6">
                                    <h3 className="text-sm font-medium text-[#6b5f57]">
                                        {t("revenue")} ({t("today")})
                                    </h3>
                                    <p className="mt-2 font-display text-3xl text-[#1b1a17]">$486.50</p>
                                </div>
                                <div className="glass-panel rounded-2xl p-6">
                                    <h3 className="text-sm font-medium text-[#6b5f57]">
                                        {t("totalOrders")} ({t("thisWeek")})
                                    </h3>
                                    <p className="mt-2 font-display text-3xl text-[#1b1a17]">156</p>
                                </div>
                                <div className="glass-panel rounded-2xl p-6">
                                    <h3 className="text-sm font-medium text-[#6b5f57]">
                                        {t("revenue")} ({t("thisMonth")})
                                    </h3>
                                    <p className="mt-2 font-display text-3xl text-[#1b1a17]">$6,234.00</p>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* Add/Edit Category Modal */}
                {showCategoryModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                        <div className="glass-panel w-full max-w-md rounded-2xl p-6">
                            <h2 className="font-display text-xl mb-4">
                                {editingCategory ? t("editCategory") : t("addCategory")}
                            </h2>
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    if (editingCategory) {
                                        updateCategoryMutation.mutate(editingCategory);
                                    } else {
                                        addCategoryMutation.mutate(newCategory);
                                    }
                                }}
                                className="space-y-4"
                            >
                                <div>
                                    <label className="text-sm font-medium text-[#1b1a17]">{t("categoryName")}</label>
                                    <input
                                        type="text"
                                        value={editingCategory ? editingCategory.name : newCategory.name}
                                        onChange={(e) =>
                                            editingCategory
                                                ? setEditingCategory({
                                                      ...editingCategory,
                                                      name: e.target.value,
                                                  })
                                                : setNewCategory({ name: e.target.value })
                                        }
                                        className="mt-1 w-full rounded-lg border border-[#e6d9cd] p-2 text-sm"
                                        required
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        type="submit"
                                        className="flex-1 rounded-full bg-[#ff6b35] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-95"
                                        disabled={addCategoryMutation.isPending || updateCategoryMutation.isPending}
                                    >
                                        {editingCategory ? t("save") : t("create")}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowCategoryModal(false);
                                            setEditingCategory(null);
                                        }}
                                        className="flex-1 rounded-full border border-[#e6d9cd] px-4 py-2 text-sm font-semibold text-[#1b1a17] transition hover:bg-[#e6d9cd]"
                                    >
                                        {tCommon("cancel")}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Add/Edit Item Modal */}
                {showItemModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                        <div className="glass-panel w-full max-w-md rounded-2xl p-6">
                            <h2 className="font-display text-xl mb-4">{editingItem ? t("editItem") : t("addItem")}</h2>
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    // Convert string form values to types matching MenuItem
                                    const formattedItem = {
                                        ...newItem,
                                        price: parseFloat(newItem.price),
                                        categoryId: parseInt(newItem.categoryId, 10), // String -> Number
                                    };
                                    if (editingItem) {
                                        updateItemMutation.mutate({
                                            ...editingItem,
                                            ...formattedItem,
                                        });
                                    } else {
                                        // formattedItem has numeric types for price/categoryId while newItem uses strings
                                        // cast to satisfy the mutation's expected type
                                        addItemMutation.mutate(formattedItem as unknown as typeof newItem);
                                    }
                                }}
                                className="space-y-4"
                            >
                                <div>
                                    <label className="text-sm font-medium text-[#1b1a17]">{t("itemName")}</label>
                                    <input
                                        type="text"
                                        value={editingItem ? editingItem.name : newItem.name}
                                        onChange={(e) =>
                                            editingItem
                                                ? setEditingItem({ ...editingItem, name: e.target.value })
                                                : setNewItem({ ...newItem, name: e.target.value })
                                        }
                                        className="mt-1 w-full rounded-lg border border-[#e6d9cd] p-2 text-sm"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-[#1b1a17]">{t("description")}</label>
                                    <textarea
                                        value={
                                            editingItem ? (editingItem.description ?? "") : (newItem.description ?? "")
                                        }
                                        onChange={(e) =>
                                            editingItem
                                                ? setEditingItem({ ...editingItem, description: e.target.value })
                                                : setNewItem({ ...newItem, description: e.target.value })
                                        }
                                        className="mt-1 w-full rounded-lg border border-[#e6d9cd] p-2 text-sm"
                                        rows={3}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-[#1b1a17]">{t("price")}</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={editingItem ? editingItem.price : newItem.price}
                                        onChange={(e) =>
                                            editingItem
                                                ? setEditingItem({ ...editingItem, price: parseFloat(e.target.value) })
                                                : setNewItem({ ...newItem, price: e.target.value })
                                        }
                                        className="mt-1 w-full rounded-lg border border-[#e6d9cd] p-2 text-sm"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-[#1b1a17]">{t("category")}</label>
                                    <select
                                        value={editingItem ? editingItem.categoryId : newItem.categoryId}
                                        onChange={(e) =>
                                            editingItem
                                                ? setEditingItem({
                                                      ...editingItem,
                                                      categoryId: parseInt(e.target.value),
                                                  })
                                                : setNewItem({ ...newItem, categoryId: e.target.value })
                                        }
                                        className="mt-1 w-full rounded-lg border border-[#e6d9cd] p-2 text-sm"
                                        required
                                    >
                                        <option value="">{t("selectCategory")}</option>
                                        {menuQuery.data?.categories.map((cat) => (
                                            <option key={cat.id} value={cat.id}>
                                                {cat.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={editingItem ? editingItem.available : newItem.available}
                                        onChange={(e) =>
                                            editingItem
                                                ? setEditingItem({ ...editingItem, available: e.target.checked })
                                                : setNewItem({ ...newItem, available: e.target.checked })
                                        }
                                        id="available"
                                    />
                                    <label htmlFor="available" className="text-sm text-[#1b1a17]">
                                        {t("available")}
                                    </label>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        type="submit"
                                        className="flex-1 rounded-full bg-[#ff6b35] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-95"
                                        disabled={addItemMutation.isPending || updateItemMutation.isPending}
                                    >
                                        {editingItem ? t("save") : t("create")}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowItemModal(false);
                                            setEditingItem(null);
                                        }}
                                        className="flex-1 rounded-full border border-[#e6d9cd] px-4 py-2 text-sm font-semibold text-[#1b1a17] transition hover:bg-[#e6d9cd]"
                                    >
                                        {tCommon("cancel")}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
