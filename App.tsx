import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import SplashScreen from './src/screens/SplashScreen';
import LoginScreen from './src/screens/LoginScreen';
import SelectRowScreen from './src/screens/SelectRowScreen';
import ReplenishmentScreen from './src/screens/ReplenishmentScreen';
import AdminDashboardScreen from './src/screens/AdminDashboardScreen';
import ParticipantDashboard from './src/screens/ParticipantDashboard';
import { auth } from './src/utils/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useAppStore } from './src/store/useAppStore';

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  SelectRow: undefined;
  Replenishment: undefined;
  AdminDashboard: undefined;
  ParticipantDashboard: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const { setUser } = useAppStore();

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Splash"
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen
            name="Splash"
            component={SplashScreen}
            options={{ animation: 'fade' }}
          />
          <Stack.Screen name="Login" component={LoginScreen} options={{ animation: 'fade' }} />
          <Stack.Screen name="SelectRow" component={SelectRowScreen} />
          <Stack.Screen name="Replenishment" component={ReplenishmentScreen} />
          <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
          <Stack.Screen name="ParticipantDashboard" component={ParticipantDashboard} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
