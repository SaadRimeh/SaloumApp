# Salloum Barbershop App 💈 (تطبيق صالون سلوم)

A premium, cross-platform mobile application built for **Salloum Barbershop** to manage appointments, showcase products (perfumes & grooming), and provide a seamless customer experience.

## 🌟 Key Features

* **Authentication**: Secure user authentication (Login/Register) powered by Clerk.
* **Appointments Management**: Customers can easily view availability, book new appointments, and manage upcoming/past bookings.
* **Product Store (Perfumes)**: A built-in store displaying premium products and perfumes with gender tags. Users can reserve products for in-salon pickup.
* **Full Localization (i18n)**: 100% dynamic bilingual support (Arabic & English), including RTL (Right-To-Left) and LTR layout adaptations.
* **Dynamic Theming**: Global state management for switching seamlessly between **Light Mode** and **Dark Mode** with cohesive styling across all screens and components.
* **Adaptive UI**: Beautifully designed UI with safe area handling for edge-to-edge displays on iOS and Android.

## 🛠️ Technology Stack

* **Framework**: [React Native](https://reactnative.dev/) with [Expo](https://expo.dev/) (Expo Router for navigation)
* **Authentication**: [Clerk](https://clerk.com/)
* **Icons**: `@expo/vector-icons` (Ionicons)
* **State Management**: React Context API (`ThemeContext` for global theme & language)
* **API Integration**: Native `fetch` wrapper connecting to a RESTful Node.js/Express backend (`https://www.ssdvf.xyz`)

## 📂 Project Structure

```text
my-app/
├── app/
│   ├── (auth)/        # Authentication screens (login, register)
│   ├── (tabs)/        # Main tab navigation (home, shop, appointments, perfumes)
│   ├── product/       # Dynamic routes (e.g., product details [id].tsx)
│   ├── book.tsx       # Booking flow screen
│   ├── _layout.tsx    # Root layout & providers (Clerk, ThemeContext)
│   └── index.tsx      # Entry point
├── utils/
│   ├── api.ts         # Backend API services and TypeScript interfaces
│   └── ThemeContext.tsx # Global State Management for Theme & Language
├── assets/            # Fonts, images, and static assets
└── package.json       # Project dependencies
```

## 🚀 Getting Started

### Prerequisites
* Node.js (v16 or newer)
* npm or yarn
* [Expo CLI](https://docs.expo.dev/get-started/installation/)
* Expo Go app on your physical device (iOS/Android), or an emulator.

### Installation

1. Clone the repository and navigate to the project directory:
   ```bash
   cd my-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Setup Environment Variables:
   Create a `.env` file in the root directory and add your Clerk publishable key:
   ```env
   EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here
   ```

### Running the App

Start the Expo development server:
```bash
npx expo start
```
* Scan the QR code with the **Expo Go** app on your phone.
* Or press `a` to run on Android Emulator.
* Or press `i` to run on iOS Simulator.

## 🎨 Theme & Language Context

The application relies on a robust `ThemeContext` to provide styles on-the-fly.
To use the global settings in any new component:

```tsx
import { useAppContext } from '../../utils/ThemeContext';

export default function MyComponent() {
  const { theme, isDark, isArabic } = useAppContext();

  return (
    <View style={{ backgroundColor: theme.bg, flexDirection: isArabic ? 'row-reverse' : 'row' }}>
      <Text style={{ color: theme.textPrimary }}>
        {isArabic ? 'مرحباً بك' : 'Welcome'}
      </Text>
    </View>
  );
}
```

## 🛡️ License
Proprietary & Confidential. All rights reserved for **Salloum Barbershop**.
