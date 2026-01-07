# MC-System React Native - Complete Setup Guide

## 🚀 Quick Start (5 Minutes)

### Step 1: Install Node.js
Download and install Node.js from [nodejs.org](https://nodejs.org/) (LTS version recommended)

Verify installation:
\`\`\`bash
node --version
npm --version
\`\`\`

### Step 2: Install Expo CLI
\`\`\`bash
npm install -g expo-cli
\`\`\`

### Step 3: Install Project Dependencies
\`\`\`bash
cd medical-app-react-native
npm install
\`\`\`

### Step 4: Start the App
\`\`\`bash
npm start
\`\`\`

### Step 5: View on Your Device
1. Install **Expo Go** app from:
   - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
   - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. Scan the QR code displayed in your terminal with:
   - **iOS**: Camera app
   - **Android**: Expo Go app

## 📱 Testing the App

### Using Demo Accounts

The app includes two demo accounts for instant testing:

#### Patient Demo
- Tap "Demo Patient Login" button
- Automatically logs in as a patient
- Explore the patient dashboard

#### Doctor Demo
- Tap "Demo Doctor Login" button
- Automatically logs in as a doctor
- Explore the doctor dashboard

### Manual Login/Signup

You can also create a test account:
1. Toggle to "Sign Up" mode
2. Fill in:
   - Full Name: Any name
   - Email: Any email format
   - Password: Any password
   - Select role: Patient or Doctor
3. Tap "Sign Up"

**Note**: Since there's no backend, any credentials will work!

## 🎨 Features to Test

### As a Patient
- ✅ View connected doctors
- ✅ Browse medical records
- ✅ Check upcoming appointments
- ✅ Navigate between tabs

### As a Doctor
- ✅ View today's appointment count
- ✅ See total patients
- ✅ Approve/reject connection requests
- ✅ View schedule
- ✅ Browse recent patients
- ✅ Navigate between tabs

## 💻 Development Tips

### Running on iOS Simulator (Mac Only)
\`\`\`bash
npm run ios
\`\`\`

### Running on Android Emulator
First, set up Android Studio and an emulator, then:
\`\`\`bash
npm run android
\`\`\`

### Running on Web Browser
\`\`\`bash
npm run web
\`\`\`

### Viewing on Multiple Devices
When you run `npm start`, the QR code can be scanned by multiple devices simultaneously, allowing you to test on different phones at once!

## 🔧 Customization Guide

### Change Colors

Open any screen file (e.g., `src/screens/LoginScreen.js`) and modify the StyleSheet:

\`\`\`javascript
const styles = StyleSheet.create({
  // Change primary color (teal)
  btnPrimary: {
    backgroundColor: '#0D9488', // ← Change this
    // ...
  },
  
  // Change background color
  container: {
    backgroundColor: '#FDF8F3', // ← Change this
    // ...
  },
});
\`\`\`

### Add New Screens

1. Create a new file in `src/screens/`:
\`\`\`javascript
// src/screens/NewScreen.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const NewScreen = () => {
  return (
    <View style={styles.container}>
      <Text>New Screen</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default NewScreen;
\`\`\`

2. Add it to navigation in `App.js`:
\`\`\`javascript
import NewScreen from './src/screens/NewScreen';

// Inside Stack.Navigator:
<Stack.Screen name="NewScreen" component={NewScreen} />
\`\`\`

3. Navigate to it from any other screen:
\`\`\`javascript
navigation.navigate('NewScreen');
\`\`\`

### Modify Mock Data

Each screen has mock data defined in the `loadData()` function. Update it to show different information:

\`\`\`javascript
// Example: In DoctorHomeScreen.js
setTodayCount(5); // Change from 3 to 5
setTotalPatients(50); // Change from 24 to 50

// Add more appointments
setTodayAppointments([
  {
    id: 1,
    time: '10:00 AM',
    patient: 'Your Patient Name',
    type: 'Your Appointment Type',
  },
  // Add more...
]);
\`\`\`

## 🔌 Connecting to a Backend

### Method 1: Replace Mock Data with API Calls

1. Create an API service file:
\`\`\`javascript
// src/services/api.js
const API_BASE_URL = 'https://your-api.com';

export const loginUser = async (email, password, role) => {
  try {
    const response = await fetch(\`\${API_BASE_URL}/auth/login\`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, role }),
    });
    return await response.json();
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const getDoctorData = async (doctorId) => {
  const response = await fetch(\`\${API_BASE_URL}/doctors/\${doctorId}\`);
  return await response.json();
};
\`\`\`

2. Update screens to use the API:
\`\`\`javascript
// In LoginScreen.js
import { loginUser } from '../services/api';

const handleLogin = async () => {
  try {
    const user = await loginUser(email, password, selectedRole);
    // Navigate based on user data
    if (user.role === 'doctor') {
      navigation.replace('DoctorHome', { user });
    } else {
      navigation.replace('PatientHome', { user });
    }
  } catch (error) {
    setErrorMessage('Login failed');
  }
};
\`\`\`

### Method 2: Use AsyncStorage for Persistence

\`\`\`bash
npm install @react-native-async-storage/async-storage
\`\`\`

\`\`\`javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Save user data
await AsyncStorage.setItem('user', JSON.stringify(user));

// Retrieve user data
const userData = await AsyncStorage.getItem('user');
const user = JSON.parse(userData);
\`\`\`

## 🐛 Common Issues & Solutions

### Issue: "Metro bundler port 8081 already in use"
**Solution:**
\`\`\`bash
npx react-native start --reset-cache --port 8082
\`\`\`

### Issue: "Unable to connect to development server"
**Solutions:**
1. Make sure your phone and computer are on the same WiFi
2. Try tunnel mode: `expo start --tunnel`
3. Check if firewall is blocking port 19000

### Issue: App shows white screen
**Solution:**
\`\`\`bash
expo start -c
# This clears the cache
\`\`\`

### Issue: "Command not found: expo"
**Solution:**
\`\`\`bash
npm install -g expo-cli
# On Mac/Linux, you might need: sudo npm install -g expo-cli
\`\`\`

## 📦 Building for Production

### Option 1: Using EAS Build (Recommended)

\`\`\`bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo account
eas login

# Configure your project
eas build:configure

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
\`\`\`

### Option 2: Classic Build

\`\`\`bash
# For iOS (requires Mac)
expo build:ios

# For Android
expo build:android
\`\`\`

## 📊 Project Statistics

- **Total Components**: 3 main screens
- **Lines of Code**: ~1,500+
- **Dependencies**: 8 core packages
- **Supported Platforms**: iOS, Android, Web
- **Minimum React Native Version**: 0.72.6

## 🎓 Learning Resources

- [React Native Documentation](https://reactnative.dev/)
- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation Docs](https://reactnavigation.org/)
- [React Hooks Guide](https://react.dev/reference/react)

## 💡 Best Practices

1. **Performance**
   - Use FlatList for long lists
   - Implement React.memo for expensive components
   - Avoid inline styles when possible

2. **Code Organization**
   - Keep components small and focused
   - Extract reusable styles into constants
   - Use meaningful variable names

3. **Testing**
   - Test on both iOS and Android
   - Test on different screen sizes
   - Test with slow network (airplane mode)

## 🚀 Next Steps

1. **Add More Features**
   - Implement chat functionality
   - Add appointment booking
   - Create profile editing

2. **Improve UX**
   - Add loading animations
   - Implement pull-to-refresh
   - Add error boundaries

3. **Connect Backend**
   - Set up authentication
   - Implement real-time updates
   - Add data persistence

## 📞 Need Help?

- Check Expo's [Discord community](https://chat.expo.dev/)
- Visit [Stack Overflow](https://stackoverflow.com/questions/tagged/react-native)
- Read [React Native Express](https://www.reactnative.express/)

---

Happy coding! 🎉
