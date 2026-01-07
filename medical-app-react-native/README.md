# MC-System - Medical Care Platform (React Native)

A mobile medical care platform built with React Native and Expo, featuring separate interfaces for doctors and patients. This is a frontend-only implementation converted from the original Angular application.

## Features

### For Patients
- 👤 Patient authentication (sign in/sign up)
- 👨‍⚕️ View connected doctors
- 📋 Manage medical records
- 📅 View upcoming appointments
- 💬 Chat with doctors (UI ready)

### For Doctors
- ⚕️ Doctor authentication (sign in/sign up)
- 📊 Dashboard with patient statistics
- 🔔 Connection requests management
- 📅 Today's schedule view
- 👥 Recent patients list
- ⏰ Appointment management

## Design System

The app uses a warm, medical-friendly color palette:
- **Primary**: `#0D9488` (Teal) - Main actions and highlights
- **Secondary**: `#FB923C` (Orange) - Patient-specific actions
- **Accent**: `#3B82F6` (Blue) - Doctor-specific actions
- **Background**: `#FDF8F3` (Warm Beige) - Main background
- **Card Background**: `#FFFBF7` (Lighter Beige) - Card surfaces

## Tech Stack

- **Framework**: React Native with Expo
- **Navigation**: React Navigation 6
- **UI**: React Native core components with custom styling
- **State Management**: React Hooks (useState, useEffect)
- **No Backend**: Pure frontend implementation with mock data

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v14 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Expo Go app on your mobile device (iOS/Android) or an emulator

## Installation

1. Navigate to the project directory:
\`\`\`bash
cd medical-app-react-native
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
# or
yarn install
\`\`\`

## Running the App

### Development Mode

Start the Expo development server:
\`\`\`bash
npm start
# or
expo start
\`\`\`

This will open the Expo DevTools in your browser.

### Running on Physical Device

1. Install the **Expo Go** app on your iOS or Android device
2. Scan the QR code shown in the terminal or Expo DevTools
3. The app will load on your device

### Running on iOS Simulator (Mac only)

\`\`\`bash
npm run ios
# or
expo start --ios
\`\`\`

### Running on Android Emulator

\`\`\`bash
npm run android
# or
expo start --android
\`\`\`

### Running on Web

\`\`\`bash
npm run web
# or
expo start --web
\`\`\`

## Project Structure

\`\`\`
medical-app-react-native/
├── App.js                          # Main entry point
├── app.json                        # Expo configuration
├── babel.config.js                 # Babel configuration
├── package.json                    # Dependencies
├── src/
│   └── screens/
│       ├── LoginScreen.js          # Login/Signup screen
│       ├── DoctorHomeScreen.js     # Doctor dashboard
│       └── PatientHomeScreen.js    # Patient dashboard
└── assets/                         # Images and icons
\`\`\`

## Demo Credentials

### Patient Demo Login
- Email: `patient@demo.com`
- Password: `demo123`
- Role: Patient

### Doctor Demo Login
- Email: `doctor@demo.com`
- Password: `demo123`
- Role: Doctor

Click the respective demo buttons on the login screen for instant access.

## Key Components

### LoginScreen
- Handles both sign in and sign up flows
- Role selection (Patient/Doctor)
- Email and password validation
- Demo login buttons for quick testing

### DoctorHomeScreen
- Statistics dashboard (appointments, patients)
- Connection requests management
- Today's schedule
- Recent patients list
- Bottom navigation

### PatientHomeScreen
- Connected doctors list
- Medical records grid
- Upcoming appointments
- Bottom navigation

## Customization

### Colors
Update the color values in each screen's `StyleSheet` to match your brand:

\`\`\`javascript
const styles = StyleSheet.create({
  // Example: Change primary color
  btnPrimary: {
    backgroundColor: '#YOUR_COLOR', // Change from #0D9488
    // ...
  },
});
\`\`\`

### Navigation
Edit `App.js` to add new screens:

\`\`\`javascript
<Stack.Screen name="NewScreen" component={NewScreenComponent} />
\`\`\`

## Features Implementation Status

✅ **Implemented**
- Login/Signup UI and navigation
- Doctor dashboard with mock data
- Patient dashboard with mock data
- Role-based routing
- Responsive design
- Bottom navigation

⏳ **Not Implemented (Frontend Only)**
- API integration
- Real authentication
- Database persistence
- Real-time chat
- Notifications
- File upload functionality

## Converting to Full Stack

To connect this app to a backend:

1. **Create API service**:
   \`\`\`javascript
   // src/services/api.js
   const API_URL = 'https://your-backend-url.com';
   
   export const login = async (email, password, role) => {
     const response = await fetch(\`\${API_URL}/auth/login\`, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ email, password, role }),
     });
     return response.json();
   };
   \`\`\`

2. **Update screens** to use real API calls instead of mock data

3. **Add authentication storage** using AsyncStorage or SecureStore

4. **Implement token management** for authenticated requests

## Building for Production

### iOS (requires Mac)
\`\`\`bash
expo build:ios
\`\`\`

### Android
\`\`\`bash
expo build:android
\`\`\`

### Using EAS Build (recommended)
\`\`\`bash
npm install -g eas-cli
eas build --platform ios
eas build --platform android
\`\`\`

## Troubleshooting

### Common Issues

**1. Metro bundler port already in use**
\`\`\`bash
npx react-native start --reset-cache
\`\`\`

**2. Dependencies not installing**
\`\`\`bash
rm -rf node_modules
rm package-lock.json
npm install
\`\`\`

**3. Expo Go connection issues**
- Ensure your phone and computer are on the same Wi-Fi network
- Try using tunnel mode: `expo start --tunnel`

## Performance Optimization

- Images should be optimized before adding to assets
- Use FlatList for long lists instead of ScrollView
- Implement React.memo for components that don't need frequent re-renders
- Use useCallback and useMemo for expensive computations

## Accessibility

The app follows accessibility best practices:
- All touchable elements have appropriate sizes (minimum 44x44 points)
- Color contrast ratios meet WCAG AA standards
- Text is scalable
- Interactive elements have clear visual feedback

## Contributing

This is a demonstration project. For improvements:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.

## Support

For questions or issues:
- Check the [Expo documentation](https://docs.expo.dev/)
- Check the [React Navigation documentation](https://reactnavigation.org/)
- Review React Native documentation

## Acknowledgments

- Original Angular design and concept
- React Native and Expo teams
- React Navigation library

---

**Note**: This is a frontend-only implementation with mock data. No real authentication or data persistence is included. Perfect for prototyping, UI testing, or as a starting point for a full-stack application.
