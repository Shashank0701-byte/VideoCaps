import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "VideoCaps - AI Real-Time Caption Generator",
    description: "Generate real-time captions using AI-powered speech recognition",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
