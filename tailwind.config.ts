/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{ts,tsx}"],
    theme: {
      extend: {
        colors: {
          gold: "#a57d02",
        },
        boxShadow: {
          gold: "0 0 24px rgba(165, 125, 2, 0.35), 0 4px 16px rgba(0,0,0,0.6)",
        },
        keyframes: {
          fadeIn: {
            "0%": { opacity: "0", transform: "translateY(10px)" },
            "100%": { opacity: "1", transform: "translateY(0)" },
          },
          slideUp: {
            "0%": { opacity: "0", transform: "translateY(20px)" },
            "100%": { opacity: "1", transform: "translateY(0)" },
          },
          scaleIn: {
            "0%": { opacity: "0", transform: "scale(0.92)" },
            "100%": { opacity: "1", transform: "scale(1)" },
          },
          pulseGold: {
            "0%, 100%": { boxShadow: "0 0 20px rgba(165, 125, 2, 0.3)" },
            "50%": { boxShadow: "0 0 40px rgba(165, 125, 2, 0.6)" },
          },
        },
        animation: {
          fadeIn: "fadeIn 0.4s ease both",
          slideUp: "slideUp 0.35s ease both",
          scaleIn: "scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both",
          "pulse-gold": "pulseGold 2.5s ease-in-out infinite",
        },
        backgroundImage: {
          "gradient-gold": "linear-gradient(135deg, #a57d02, #d4a017, #a57d02)",
        },
      },
    },
    plugins: [],
  };