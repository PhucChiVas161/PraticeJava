import { notFound } from "next/navigation";
import { getRequestConfig } from "next-intl/server";

// Can be imported from a shared config
const locales = ["en", "vi"];

export default getRequestConfig(async ({ requestLocale }) => {
    const locale = await requestLocale;

    // Validate that the incoming locale parameter is valid
    if (!locale || !locales.includes(locale)) notFound();

    return {
        locale,
        messages: (await import(`../messages/${locale}.json`)).default,
    };
});

export { locales };
