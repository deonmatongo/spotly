import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'

import HomeScreen from '../screens/HomeScreen'
import OrdersScreen from '../screens/OrdersScreen'
import MenuScreen from '../screens/MenuScreen'
import AnalyticsScreen from '../screens/AnalyticsScreen'
import ProfileScreen from '../screens/ProfileScreen'
import OrderDetailScreen from '../screens/OrderDetailScreen'
import AddItemScreen from '../screens/AddItemScreen'
import NotificationsScreen from '../screens/NotificationsScreen'
import PayoutsScreen from '../screens/PayoutsScreen'
import ScanTicketsScreen from '../screens/ScanTicketsScreen'
import CustomTabBar from '../components/CustomTabBar'

export type RootStackParamList = {
  MainTabs: undefined
  OrderDetail: { orderId: string }
  AddItem: undefined
  Notifications: undefined
  Payouts: undefined
  ScanTickets: undefined
}

export type TabParamList = {
  Dashboard: undefined
  Orders: undefined
  Menu: undefined
  Analytics: undefined
  Profile: undefined
}

const Stack = createNativeStackNavigator<RootStackParamList>()
const Tab = createBottomTabNavigator<TabParamList>()

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={props => <CustomTabBar {...props} />}
    >
      <Tab.Screen name="Dashboard" component={HomeScreen} />
      <Tab.Screen name="Orders" component={OrdersScreen} />
      <Tab.Screen name="Menu" component={MenuScreen} />
      <Tab.Screen name="Analytics" component={AnalyticsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  )
}

export default function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="AddItem" component={AddItemScreen} options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="Payouts" component={PayoutsScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="ScanTickets" component={ScanTicketsScreen} options={{ animation: 'slide_from_bottom' }} />
    </Stack.Navigator>
  )
}
