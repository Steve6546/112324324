/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./*.{js,ts,jsx,tsx}",
    ],
    theme: {
        screens: {
            'xs': '375px',    // iPhone SE and similar small phones
            'sm': '640px',    // Small tablets and large phones
            'md': '768px',    // Tablets
            'lg': '1024px',   // Small laptops
            'xl': '1280px',   // Laptops and desktops
            '2xl': '1536px',  // Large desktops
        },
        extend: {
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'],
                arabic: ['Cairo', 'sans-serif'],
            },
            spacing: {
                '18': '4.5rem',
                '88': '22rem',
                '128': '32rem',
            },
            minHeight: {
                'screen-dvh': '100dvh', // Dynamic viewport height for mobile
            },
            maxHeight: {
                'screen-dvh': '100dvh',
            },
            animation: {
                'fade-in': 'fadeIn 0.3s ease-out',
                'fade-in-up': 'fadeInUp 0.4s ease-out',
                'slide-up': 'slideUp 0.5s ease-out',
                'slide-right': 'slideRight 0.3s ease-out',
                'pulse-slow': 'pulse 4s ease-in-out infinite',
                'bounce-subtle': 'bounce 1s infinite',
                'scale-tap': 'scaleTap 0.1s ease-out',
                'swipe-left': 'swipeLeft 0.3s ease-out',
                'swipe-right': 'swipeRight 0.3s ease-out',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                fadeInUp: {
                    '0%': { opacity: '0', transform: 'translateY(10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                slideRight: {
                    '0%': { transform: 'translateX(-10px)', opacity: '0' },
                    '100%': { transform: 'translateX(0)', opacity: '1' },
                },
                scaleTap: {
                    '0%': { transform: 'scale(1)' },
                    '50%': { transform: 'scale(0.95)' },
                    '100%': { transform: 'scale(1)' },
                },
                swipeLeft: {
                    '0%': { transform: 'translateX(0)', opacity: '1' },
                    '100%': { transform: 'translateX(-100%)', opacity: '0' },
                },
                swipeRight: {
                    '0%': { transform: 'translateX(0)', opacity: '1' },
                    '100%': { transform: 'translateX(100%)', opacity: '0' },
                },
            },
            touchAction: {
                'pan-x': 'pan-x',
                'pan-y': 'pan-y',
                'pinch-zoom': 'pinch-zoom',
            },
        },
    },
    plugins: [],
}
