import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import { Ionicons } from '@expo/vector-icons';

// Import screens
import MonitorScreen from './src/screens/MonitorScreen';
import GeneratorScreen from './src/screens/GeneratorScreen';
import AnalysisScreen from './src/screens/AnalysisScreen';
import ReportsScreen from './src/screens/ReportsScreen';
import SettingsScreen from './src/screens/SettingsScreen';

// Import services
import { initializeDatabase } from './src/services/DatabaseService';
import { startBackgroundMonitoring } from './src/services/BackgroundService';

const Tab = createBottomTabNavigator();
const BACKGROUND_MONITORING_TASK = 'state51-background-monitoring';

// Define background task
TaskManager.defineTask(BACKGROUND_MONITORING_TASK, async () => {
  try {
    const now = Date.now();
    console.log(`Background monitoring at ${new Date(now).toISOString()}`);
    // Background monitoring logic will be handled by BackgroundService
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error('Background task error:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export default function App() {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Initialize database
      await initializeDatabase();

      // Start background monitoring
      await startBackgroundMonitoring(BACKGROUND_MONITORING_TASK);

      setIsInitialized(true);
    } catch (error) {
      console.error('App initialization error:', error);
    }
  };

  if (!isInitialized) {
    return null; // Or a loading screen
  }

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            switch (route.name) {
              case 'Monitor':
                iconName = focused ? 'pulse' : 'pulse-outline';
                break;
              case 'Generator':
                iconName = focused ? 'radio' : 'radio-outline';
                break;
              case 'Analysis':
                iconName = focused ? 'analytics' : 'analytics-outline';
                break;
              case 'Reports':
                iconName = focused ? 'document-text' : 'document-text-outline';
                break;
              case 'Settings':
                iconName = focused ? 'settings' : 'settings-outline';
                break;
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#00ff88',
          tabBarInactiveTintColor: '#gray',
          tabBarStyle: {
            backgroundColor: '#000',
            borderTopColor: '#00ff88',
            borderTopWidth: 1,
          },
          headerStyle: {
            backgroundColor: '#000',
          },
          headerTintColor: '#00ff88',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        })}
      >
        <Tab.Screen
          name="Monitor"
          component={MonitorScreen}
          options={{ title: 'Live Monitor' }}
        />
        <Tab.Screen
          name="Generator"
          component={GeneratorScreen}
          options={{ title: 'State 51 Generator' }}
        />
        <Tab.Screen
          name="Analysis"
          component={AnalysisScreen}
          options={{ title: 'Analysis' }}
        />
        <Tab.Screen
          name="Reports"
          component={ReportsScreen}
          options={{ title: 'Daily Reports' }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ title: 'Settings' }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}