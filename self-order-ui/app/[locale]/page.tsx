import Link from "next/link";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function Home() {
    const t = useTranslations("nav");
    const tOrder = useTranslations("order");
    const tKitchen = useTranslations("kitchen");
    const tHome = useTranslations("home");
    const tWaiter = useTranslations("waiter");

    const locale = useLocale();

    return (
        <div className="page-gradient flex flex-1 flex-col">
            <div className="absolute top-4 right-4">
                <LanguageSwitcher />
            </div>
            <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-6 py-12">
                <header className="flex flex-col gap-6">
                    <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#f1c9b0] bg-white px-3 py-1 text-xs uppercase tracking-[0.2em] text-[#6b5f57]">
                        {tHome("suite")}
                    </span>
                    <h1 className="font-display text-4xl leading-tight text-[#1b1a17] sm:text-5xl">
                        {tHome("welcome")}
                    </h1>
                    <p className="max-w-2xl text-base leading-7 text-[#6b5f57]">{tHome("discover")}</p>
                </header>

                <section className="grid gap-4 md:grid-cols-3">
                    <div className="glass-panel flex flex-col gap-4 rounded-2xl p-6 shadow-sm">
                        <h2 className="font-display text-xl">{t("order")}</h2>
                        <p className="text-sm text-[#6b5f57]">{tHome("qr")}</p>
                        <Link
                            className="mt-auto inline-flex items-center justify-center rounded-full bg-[#ff6b35] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-95"
                            href={`/${locale}/order?restaurantCode=ABC123&tableId=1`}
                        >
                            {tOrder("title")}
                        </Link>
                    </div>

                    <div className="glass-panel flex flex-col gap-4 rounded-2xl p-6 shadow-sm">
                        <h2 className="font-display text-xl">{t("kitchen")}</h2>
                        <p className="text-sm text-[#6b5f57]">{tHome("realtime")}</p>
                        <Link
                            className="mt-auto inline-flex items-center justify-center rounded-full border border-[#1b1a17] px-4 py-2 text-sm font-semibold text-[#1b1a17] transition hover:bg-[#1b1a17] hover:text-white"
                            href={`/${locale}/kitchen?restaurantCode=ABC123`}
                        >
                            {tKitchen("title")}
                        </Link>
                    </div>

                    <div className="glass-panel flex flex-col gap-4 rounded-2xl p-6 shadow-sm">
                        <h2 className="font-display text-xl">{t("waiter")}</h2>
                        <p className="text-sm text-[#6b5f57]">{tHome("realtime")}</p>
                        <Link
                            className="mt-auto inline-flex items-center justify-center rounded-full border border-[#1b1a17] px-4 py-2 text-sm font-semibold text-[#1b1a17] transition hover:bg-[#1b1a17] hover:text-white"
                            href={`/${locale}/waiter?restaurantCode=ABC123`}
                        >
                            {tWaiter("title")}
                        </Link>
                    </div>

                    <div className="glass-panel flex flex-col gap-4 rounded-2xl p-6 shadow-sm">
                        <h2 className="font-display text-xl">{t("admin")}</h2>
                        <p className="text-sm text-[#6b5f57]">{tHome("management")}</p>
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
                        <h3 className="font-display text-lg">{tHome("workflow")}</h3>
                        <p className="text-sm text-[#6b5f57]">{tHome("workflowDescription")}</p>
                    </div>
                    <div className="glass-panel flex flex-col gap-3 rounded-2xl p-6">
                        <h3 className="font-display text-lg">{tHome("multiTenant")}</h3>
                        <p className="text-sm text-[#6b5f57]">{tHome("multiTenantDescription")}</p>
                    </div>
                </section>
            </main>
        </div>
    );
}
