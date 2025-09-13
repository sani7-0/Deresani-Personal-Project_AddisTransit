import { Outlet } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle"; // <- new file
import "./index.css";

export default function Layout() {
    return (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <Helmet>
                <title>v0 App</title>
                <meta name="description" content="Created with v0" />
                <meta name="generator" content="v0.app" />
            </Helmet>

            <div className="min-h-screen bg-background text-foreground flex flex-col">
                {/* Simple header with toggle */}
                <header className="p-4 flex justify-end border-b">
                    <ThemeToggle />
                </header>

                {/* Page content */}
                <main className="flex-1 p-4">
                    <Outlet />
                </main>
            </div>
        </ThemeProvider>
    );
}
