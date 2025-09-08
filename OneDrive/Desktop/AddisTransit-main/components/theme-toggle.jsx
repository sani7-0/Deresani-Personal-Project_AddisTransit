import { useTheme } from "next-themes";

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();

    return (
        <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="px-3 py-1 rounded border"
        >
            {theme === "dark" ? "🌙 Dark" : "☀️ Light"}
        </button>
    );
}
