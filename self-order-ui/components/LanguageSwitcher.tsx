"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { locales } from "@/i18n/request";

export default function LanguageSwitcher() {
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const t = useTranslations("language");

    const handleLocaleChange = (newLocale: string) => {
        // Replace the locale segment in the pathname
        const segments = pathname.split("/");
        segments[1] = newLocale;
        const newPath = segments.join("/");
        router.push(newPath);
    };

    return (
        <div className="flex items-center gap-2">
            {locales.map((loc) => (
                <button
                    key={loc}
                    onClick={() => handleLocaleChange(loc)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                        locale === loc ? "bg-orange-500 text-white" : "bg-white text-gray-600 hover:bg-gray-100"
                    }`}
                >
                    {loc === "en" ? t("switchToEnglish") : t("switchToVietnamese")}
                </button>
            ))}
        </div>
    );
}
