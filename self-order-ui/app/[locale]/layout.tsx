import type { Metadata } from "next";
import { Fraunces, Space_Grotesk } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";

const spaceGrotesk = Space_Grotesk({
    variable: "--font-space-grotesk",
    subsets: ["latin"],
});

const fraunces = Fraunces({
    variable: "--font-fraunces",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Self-Order Studio",
    description: "Modern self-order experience for restaurants",
};

export default async function RootLayout({
    children,
    params,
}: Readonly<{
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}>) {
    const { locale } = await params;
    const messages = await getMessages();

    return (
        <html lang={locale} className={`${spaceGrotesk.variable} ${fraunces.variable} h-full antialiased`}>
            <body className="min-h-full flex flex-col">
                <NextIntlClientProvider messages={messages}>
                    <Providers>{children}</Providers>
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
