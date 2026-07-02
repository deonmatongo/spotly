import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { FareBreakdown } from '../data/mock'

import HomeScreen from '../screens/HomeScreen'
import DiscoverScreen from '../screens/DiscoverScreen'
import EarningsScreen from '../screens/EarningsScreen'
import ProfileScreen from '../screens/ProfileScreen'
import JobDetailScreen from '../screens/JobDetailScreen'
import ActiveDeliveryScreen from '../screens/ActiveDeliveryScreen'
import ChatScreen from '../screens/ChatScreen'
import ShopChecklistScreen from '../screens/ShopChecklistScreen'
import FareBreakdownScreen from '../screens/FareBreakdownScreen'
import ProDashboardScreen from '../screens/ProDashboardScreen'
import SafetyHubScreen from '../screens/SafetyHubScreen'
import CustomTabBar from '../components/CustomTabBar'

export type RootStackParamList = {
  MainTabs: undefined
  JobDetail: { jobId: string }
  ActiveDelivery: undefined
  Chat: undefined
  ShopChecklist: undefined
  FareBreakdown: { fare: FareBreakdown }
  ProDashboard: undefined
  SafetyHub: undefined
}

export type TabParamList = {
  Jobs: undefined
  Discover: undefined
  Earnings: undefined
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
      <Tab.Screen name="Jobs" component={HomeScreen} />
      <Tab.Screen name="Discover" component={DiscoverScreen} />
      <Tab.Screen name="Earnings" component={EarningsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  )
}

export default function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      <Stack.Screen name="JobDetail" component={JobDetailScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="ActiveDelivery" component={ActiveDeliveryScreen} options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="Chat" component={ChatScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="ShopChecklist" component={ShopChecklistScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="FareBreakdown" component={FareBreakdownScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="ProDashboard" component={ProDashboardScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="SafetyHub" component={SafetyHubScreen} options={{ animation: 'slide_from_right' }} />
    </Stack.Navigator>
  )
}
