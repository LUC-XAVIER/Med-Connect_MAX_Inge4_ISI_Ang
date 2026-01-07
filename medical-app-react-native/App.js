import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import LoginScreen from './src/screens/LoginScreen';
import DoctorHomeScreen from './src/screens/DoctorHomeScreen';
import PatientHomeScreen from './src/screens/PatientHomeScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <>
      <StatusBar style="auto" />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Login"
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="DoctorHome" component={DoctorHomeScreen} />
          <Stack.Screen name="PatientHome" component={PatientHomeScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}
