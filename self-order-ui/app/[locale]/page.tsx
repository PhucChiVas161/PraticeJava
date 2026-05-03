import Link from "next/link";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function Home() {
    const t = useTranslations("nav");
    const tCommon = useTranslations("common");
    const tOrder = useTranslations("order");
    const tKitchen = useTranslations("kitchen");
    const tAdmin = useTranslations("admin");

    const locale = useLocale();

    return (
        <div className="page-gradient flex flex-1 flex-col">
            <div className="absolute top-4 right-4">
                <LanguageSwitcher />
            </div>
            <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-6 py-12">
                <header className="flex flex-col gap-6">
                    <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#f1c9b0] bg-white px-3 py-1 text-xs uppercase tracking-[0.2em] text-[#6b5f57]">
                        Self-order suite
                    </span>
                    <h1 className="font-display text-4xl leading-tight text-[#1b1a17] sm:text-5xl">
                        Craft a table-side experience that feels effortless.
                    </h1>
                    <p className="max-w-2xl text-base leading-7 text-[#6b5f57]">
                        A mobile-first ordering flow that keeps customers in control while the kitchen stays in sync.
                        Jump into the demo views below to see the customer, kitchen, and admin dashboards.
                    </p>
                </header>

                <section className="grid gap-4 md:grid-cols-3">
                    <div className="glass-panel flex flex-col gap-4 rounded-2xl p-6 shadow-sm">
                        <h2 className="font-display text-xl">{t("order")}</h2>
                        <p className="text-sm text-[#6b5f57]">
                            Scan a QR, browse the menu, and send orders straight to the kitchen.
                        </p>
                        <Link
                            className="mt-auto inline-flex items-center justify-center rounded-full bg-[#ff6b35] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-95"
                            href={`/${locale}/order?restaurantCode=ABC123&tableId=1`}
                        >
                            {tOrder("title")}
                        </Link>
                    </div>

                    <div className="glass-panel flex flex-col gap-4 rounded-2xl p-6 shadow-sm">
                        <h2 className="font-display text-xl">{t("kitchen")}</h2>
                        <p className="text-sm text-[#6b5f57]">
                            See incoming tickets in real time and move them through prep.
                        </p>
                        <Link
                            className="mt-auto inline-flex items-center justify-center rounded-full border border-[#1b1a17] px-4 py-2 text-sm font-semibold text-[#1b1a17] transition hover:bg-[#1b1a17] hover:text-white"
                            href={`/${locale}/kitchen?restaurantCode=ABC123`}
                        >
                            {tKitchen("title")}
                        </Link>
                    </div>

                    <div className="glass-panel flex flex-col gap-4 rounded-2xl p-6 shadow-sm">
                        <h2 className="font-display text-xl">{t("admin")}</h2>
                        <p className="text-sm text-[#6b5f57]">
                            Manage menus, tables, and operational insights in one place.
                        </p>
                        <Link
                            className="mt-auto inline-flex items-center justify-center rounded-full border border-[#265d97] px-4 py-2 text-sm font-semibold text-[#265d97] transition hover:bg-[#265d97] hover:text-white"
                            href={`/${locale}/admin?restaurantCode=ABC123`}
                        >
                            {t("admin")}
                        </Link>
                    </div>
                </section>

                <section className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
                    <div className="glass-panel flex flex-col gap-3 rounded-2xl p-6">
                        <h3 className="font-display text-lg">Realtime workflow</h3>
                        <p className="text-sm text-[#6b5f57]">
                            Orders stream through WebSockets so updates arrive instantly to the kitchen and back to the
                            table. The status ladder keeps every step accountable.
                        </p>
                    </div>
                    <div className="glass-panel flex flex-col gap-3 rounded-2xl p-6">
                        <h3 className="font-display text-lg">Ready for multi-tenant</h3>
                        <p className="text-sm text-[#6b5f57]">
                            Restaurant codes scope every menu, table, and order so each venue stays fully isolated.
                        </p>
                    </div>
                </section>
            </main>
        </div>
    );
}
