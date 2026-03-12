import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AppProvider, useApp } from './src/context/AppContext';
import POSScreen from './src/screens/POSScreen';
import RFMScreen from './src/screens/RFMScreen';
import CustomersScreen from './src/screens/CustomersScreen';
import MenuScreen from './src/screens/MenuScreen';
import OrdersScreen from './src/screens/OrdersScreen';
import RegisterScreen from './src/screens/RegisterScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const NAV_THEME = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: '#0f1117', card: '#0a0d16', text: '#e2e8f0', border: '#1e293b', primary: '#f59e0b' },
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: { backgroundColor: '#0a0d16', borderTopColor: '#1e293b', borderTopWidth: 1, paddingBottom: 6, paddingTop: 6, height: 62 },
        tabBarActiveTintColor: '#f59e0b',
        tabBarInactiveTintColor: '#475569',
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
        tabBarIcon: ({ focused, color }) => {
          const icons = {
            POS: focused ? 'cart' : 'cart-outline',
            Orders: focused ? 'receipt' : 'receipt-outline',
            RFM: focused ? 'bar-chart' : 'bar-chart-outline',
            Customers: focused ? 'people' : 'people-outline',
            Menu: focused ? 'restaurant' : 'restaurant-outline',
          };
          return <Ionicons name={icons[route.name]} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="POS" component={POSScreen} options={{ tabBarLabel: '收银台' }} />
      <Tab.Screen name="Orders" component={OrdersScreen} options={{ tabBarLabel: '订单' }} />
      <Tab.Screen name="RFM" component={RFMScreen} options={{ tabBarLabel: 'RFM' }} />
      <Tab.Screen name="Customers" component={CustomersScreen} options={{ tabBarLabel: '客户' }} />
      <Tab.Screen name="Menu" component={MenuScreen} options={{ tabBarLabel: '菜单' }} />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { loaded } = useApp();
  if (!loaded) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0f1117', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#f59e0b" size="large" />
        <Text style={{ color: '#64748b', marginTop: 12, fontSize: 13 }}>加载中...</Text>
      </View>
    );
  }
  return (
    <NavigationContainer theme={NAV_THEME}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen name="Register" component={RegisterScreen} options={{ presentation: 'modal' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#0f1117' }}>
      <SafeAreaProvider>
        <AppProvider>
          <StatusBar style="light" backgroundColor="#0f1117" />
          <AppNavigator />
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
