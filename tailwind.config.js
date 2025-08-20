/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#e3d0bf",
        primary: "#541424",
        secondary: "#e3d7cb",
        text: "#e3d7cb",
        gradientTop: "#e3d0bf",
        gradientBottom: "#541424",
      },
      fontFamily: {
        urbanist: ["Urbanist-Regular"],
        "urbanist-medium": ["Urbanist-Medium"],
        "urbanist-semibold": ["Urbanist-SemiBold"],
        "urbanist-bold": ["Urbanist-Bold"],
      },
    },
  },
  plugins: [],
};
