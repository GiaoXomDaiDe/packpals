 /** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './app/**/*.{js,jsx,ts,tsx}',
        './components/**/*.{js,jsx,ts,tsx}',
    ],
    presets: [require('nativewind/preset')],
    theme: {
        extend: {
            fontFamily: {
                Jakarta: ['Jakarta', 'sans-serif'],
                JakartaBold: ['Jakarta-Bold', 'sans-serif'],
                JakartaExtraBold: ['Jakarta-ExtraBold', 'sans-serif'],
                JakartaExtraLight: ['Jakarta-ExtraLight', 'sans-serif'],
                JakartaLight: ['Jakarta-Light', 'sans-serif'],
                JakartaMedium: ['Jakarta-Medium', 'sans-serif'],
                JakartaSemiBold: ['Jakarta-SemiBold', 'sans-serif'],
            },
            colors: {
                // App Design System Colors
                background: '#fafafa',
                surface: '#ffffff',
                surfaceVariant: '#f8f9fa',
                primary: {
                    DEFAULT: '#2563eb',
                    soft: '#dbeafe',
                },
                secondary: '#64748b',
                accent: {
                    DEFAULT: '#06b6d4',
                    soft: '#e0f7fa',
                },
                success: {
                    DEFAULT: '#059669',
                    soft: '#d1fae5',
                },
                warning: {
                    DEFAULT: '#d97706',
                    soft: '#fed7aa',
                },
                error: {
                    DEFAULT: '#dc2626',
                    soft: '#fee2e2',
                },
                text: {
                    DEFAULT: '#1e293b',
                    secondary: '#64748b',
                    tertiary: '#94a3b8',
                },
                border: '#e2e8f0',
                shadow: 'rgba(15, 23, 42, 0.08)',
            },
        },
    },
    plugins: [],
}
