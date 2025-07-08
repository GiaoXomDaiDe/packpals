# � PackPals - Package Storage Management App

A modern React Native application for package storage management, connecting storage renters with storage keepers. Built with Expo and TypeScript, integrated with PackPals backend API.

## ✨ Features

- 🔐 **Authentication**: Secure user authentication with JWT
- 🗺️ **Storage Location Maps**: Google Maps integration for storage locations
- 📦 **Storage Management**: Browse and book storage spaces
- 💳 **Payment Integration**: Secure payments with VNPay
- ⭐ **Rating System**: Rate storage providers and experiences
- 📱 **Real-time Updates**: Live updates on storage availability
- 🎨 **Modern UI**: Beautiful interface with NativeWind (Tailwind CSS)

## 🛠️ Tech Stack

- **Frontend**: React Native with Expo
- **Language**: TypeScript
- **Routing**: Expo Router
- **Authentication**: JWT (integrated with PackPals backend)
- **Backend**: ASP.NET Core 8.0 with Clean Architecture
- **Database**: SQL Server (Azure)
- **Payment**: VNPay
- **Maps**: React Native Maps + Google Maps API
- **State Management**: Zustand
- **Styling**: NativeWind (Tailwind CSS for React Native)

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- Expo CLI
- iOS Simulator or Android Emulator
- Google Maps API key
- Stripe API keys
- Clerk API keys
- NeonDB connection

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/PackPals.git
cd PackPals
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory and add your API keys:

```env
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_key
EXPO_PUBLIC_GOOGLE_API_KEY=your_google_maps_key
DATABASE_URL=your_neon_db_url
```

4. Start the development server:

```bash
npm start
```

5. Run on your preferred platform:

```bash
# iOS
npm run ios

# Android
npm run android

# Web
npm run web
```

## 🏗️ Project Structure

```
PackPals/
├── app/                    # App screens (Expo Router)
│   ├── (api)/             # API routes
│   ├── (auth)/            # Authentication screens
│   ├── (root)/            # Main app screens
│   └── (tabs)/            # Tab navigation
├── components/            # Reusable UI components
├── lib/                   # Business logic & utilities
├── types/                 # TypeScript type definitions
├── store/                 # Global state management
├── constants/             # App constants
├── hooks/                 # Custom React hooks
├── assets/                # Images, fonts, icons
└── docs/                  # Documentation
```

## 🤖 AI Driver Recommendation System

Our AI system learns from user behavior and provides personalized driver suggestions based on:

- Distance and proximity
- Driver ratings and reviews
- Vehicle capacity and type
- Time patterns and preferences
- Weather and traffic conditions
- User's ride history
- Real-time demand and surge pricing

## 📱 Screenshots

[Add screenshots here]

## 🔧 Configuration

### Google Maps Setup

1. Get a Google Maps API key from Google Cloud Console
2. Enable the following APIs:
   - Maps SDK for Android
   - Maps SDK for iOS
   - Places API
   - Directions API

### Stripe Setup

1. Create a Stripe account
2. Get your publishable and secret keys
3. Configure webhooks for payment events

### Clerk Setup

1. Create a Clerk application
2. Configure social logins (Google, Apple, etc.)
3. Set up user metadata

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Expo](https://expo.dev/)
- UI inspired by modern ride-sharing apps
- AI recommendations powered by custom algorithms

---

Video source: <https://www.youtube.com/watch?v=kmy_YNhl0mw&t=174s>
