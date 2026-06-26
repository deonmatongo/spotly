import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors } from '../theme'
import { useTheme } from '../context/ThemeContext'
import { Listing } from '../data/mock'
import { useCart } from '../context/CartContext'

import HomeScreen from '../screens/HomeScreen'
import SearchScreen from '../screens/SearchScreen'
import BookingsScreen from '../screens/BookingsScreen'
import CartScreen from '../screens/CartScreen'
import ProfileScreen from '../screens/ProfileScreen'
import DetailScreen from '../screens/DetailScreen'
import BookingScreen from '../screens/BookingScreen'
import CheckoutScreen from '../screens/CheckoutScreen'
import ReviewsScreen from '../screens/ReviewsScreen'
import OrderTrackingScreen from '../screens/OrderTrackingScreen'
import TicketConfirmationScreen from '../screens/TicketConfirmationScreen'
import MyTicketsScreen from '../screens/MyTicketsScreen'
import FavoritesScreen from '../screens/FavoritesScreen'
import NotificationsScreen from '../screens/NotificationsScreen'
import OffersScreen from '../screens/OffersScreen'
import SupportScreen from '../screens/SupportScreen'
import CourierScreen from '../screens/CourierScreen'

export type RootStackParamList = {
  MainTabs: undefined
  Detail: { listing: Listing }
  Booking: { listing: Listing; slot?: string; partySize?: number; date?: string }
  Checkout: { subtotal: number; deliveryFee: number; total: number }
  Reviews: undefined
  OrderTracking: { orderNumber: string; total: number; items: number }
  TicketConfirmation: { orderNumber: string; email: string; eventName: string; total: number; items: number; eventDate: string; eventTime: string; venue: string }
  MyTickets: undefined
  Favorites: undefined
  Notifications: undefined
  Offers: undefined
  Support: undefined
  Courier: undefined
}

export type TabParamList = {
  Home: undefined
  Search: { category?: string; query?: string } | undefined
  Bookings: undefined
  Cart: undefined
  Profile: undefined
}

const Stack = createNativeStackNavigator<RootStackParamList>()
const Tab = createBottomTabNavigator<TabParamList>()

type TabIconName =
  | 'home' | 'home-outline'
  | 'search' | 'search-outline'
  | 'calendar-clear' | 'calendar-clear-outline'
  | 'cart' | 'cart-outline'
  | 'person' | 'person-outline'

const tabIcons: Record<string, [TabIconName, TabIconName]> = {
  Home: ['home', 'home-outline'],
  Search: ['search', 'search-outline'],
  Bookings: ['calendar-clear', 'calendar-clear-outline'],
  Cart: ['cart', 'cart-outline'],
  Profile: ['person', 'person-outline'],
}

function TabNavigator() {
  const { totalItems } = useCart()
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const tabBarHeight = 58 + insets.bottom

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textLight,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: tabBarHeight,
          paddingBottom: insets.bottom + 4,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginTop: 2,
        },
        tabBarBadge: route.name === 'Cart' && totalItems > 0 ? totalItems : undefined,
        tabBarBadgeStyle: {
          backgroundColor: colors.primary,
          fontSize: 10,
          minWidth: 16,
          height: 16,
          lineHeight: 16,
        },
        tabBarIcon: ({ focused, color }) => {
          const [active, inactive] = tabIcons[route.name] ?? ['home', 'home-outline']
          return <Ionicons name={focused ? active : inactive} size={22} color={color} />
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Bookings" component={BookingsScreen} />
      <Tab.Screen name="Cart" component={CartScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  )
}

export default function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      <Stack.Screen name="Detail" component={DetailScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="Booking" component={BookingScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="Reviews" component={ReviewsScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="TicketConfirmation" component={TicketConfirmationScreen} options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="MyTickets" component={MyTicketsScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="Favorites" component={FavoritesScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="Offers" component={OffersScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="Support" component={SupportScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="Courier" component={CourierScreen} options={{ animation: 'slide_from_right' }} />
    </Stack.Navigator>
  )
}
