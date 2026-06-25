/**
 * EcoFix AI - React Native Application Entry Point
 * ================================================
 * This is the root file of the mobile application. It sets up the NavigationContainer
 * and wraps the entire application within the core UI layouts.
 * 
 * Usage:
 *   Expo loads this file on startup. It points directly to `TabNavigator` to 
 *   handle the main screen routing.
 */

import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MapPin, Camera, ClipboardList, User, Leaf, Settings, Activity } from 'lucide-react-native';

// Screens imports (to be created)
import DashboardScreen from './src/screens/DashboardScreen';
import MapScreen from './src/screens/MapScreen';
import CameraScreen from './src/screens/CameraScreen';
import EcoScannerScreen from './src/screens/EcoScannerScreen';
import ProjectDetailScreen from './src/screens/ProjectDetailScreen';
import TipsScreen from './src/screens/TipsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Bottom tabs navigation flow
function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ navigation }) => ({
        tabBarActiveTintColor: '#10b981', // Emerald brand color
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          backgroundColor: '#121214',
          borderTopColor: '#1f2937',
          paddingBottom: 5,
          height: 60,
        },
        headerStyle: {
          backgroundColor: '#121214',
          borderBottomColor: '#1f2937',
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerRight: () => (
          <View style={{ flexDirection: 'row', marginRight: 16, gap: 16 }}>
            <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
              <Settings color="#ffffff" size={24} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
              <User color="#ffffff" size={24} />
            </TouchableOpacity>
          </View>
        ),
      })}
    >
      <Tab.Screen 
        name="Feed" 
        component={DashboardScreen} 
        options={{
          title: 'EcoFix Feed',
          tabBarIcon: ({ color, size }) => <ClipboardList color={color} size={size} />,
        }}
      />
      <Tab.Screen 
        name="Map" 
        component={MapScreen} 
        options={{
          title: 'Civic Map',
          tabBarIcon: ({ color, size }) => <MapPin color={color} size={size} />,
        }}
      />
      <Tab.Screen 
        name="Tips" 
        component={TipsScreen} 
        options={{
          title: 'Tips & AI',
          tabBarIcon: ({ color, size }) => <Leaf color={color} size={size} />,
        }}
      />
      <Tab.Screen 
        name="Upload"  
        component={CameraScreen} 
        options={{
          title: 'Report Issue',
          tabBarIcon: ({ color, size }) => <Camera color={color} size={size} />,
        }}
      />
      <Tab.Screen 
        name="Footprint" 
        component={EcoScannerScreen} 
        options={{
          title: 'Footprint',
          tabBarIcon: ({ color, size }) => <Activity color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerStyle: {
              backgroundColor: '#121214',
            },
            headerTintColor: '#ffffff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
          <Stack.Screen 
            name="Main" 
            component={TabNavigator} 
            options={{ headerShown: false }} 
          />
          <Stack.Screen 
            name="ProjectDetail" 
            component={ProjectDetailScreen} 
            options={{ title: 'Bespoke Roadmap' }} 
          />
          <Stack.Screen 
            name="Profile" 
            component={ProfileScreen} 
            options={{ title: 'Citizen Profile' }} 
          />
          <Stack.Screen 
            name="Settings" 
            component={SettingsScreen} 
            options={{ title: 'App Settings' }} 
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
