import React from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors, radius } from '../theme'

const CART_BADGE = 2

const ICON_MAP: Record<string, [string, string]> = {
  Home: ['home', 'home-outline'],
  Bookings: ['map', 'map-outline'],
  Cart: ['cart', 'cart-outline'],
  Profile: ['person', 'person-outline'],
}

export default function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets()

  const press = (name: string, key: string, focused: boolean) => {
    const event = navigation.emit({ type: 'tabPress', target: key, canPreventDefault: true })
    if (!focused && !event.defaultPrevented) {
      navigation.navigate(name)
    }
  }

  return (
    <View style={[styles.wrapper, { paddingBottom: insets.bottom || 12 }]}>
      <View style={styles.bar}>
        {state.routes.map((route, i) => {
          const focused = state.index === i

          if (route.name === 'Search') {
            return (
              <Pressable
                key={route.key}
                onPress={() => press(route.name, route.key, focused)}
                style={[styles.searchPill, focused && styles.searchPillActive]}
              >
                <Ionicons
                  name="search-outline"
                  size={15}
                  color={focused ? colors.primary : colors.textMuted}
                />
                <Text style={[styles.searchText, focused && styles.searchTextActive]}>
                  Search
                </Text>
              </Pressable>
            )
          }

          const [activeIcon, inactiveIcon] = ICON_MAP[route.name] ?? ['grid-outline', 'grid-outline']
          const isCart = route.name === 'Cart'

          return (
            <Pressable
              key={route.key}
              onPress={() => press(route.name, route.key, focused)}
              style={styles.iconBtn}
            >
              <View style={[styles.iconCircle, focused && styles.iconCircleActive]}>
                <Ionicons
                  name={(focused ? activeIcon : inactiveIcon) as any}
                  size={20}
                  color={focused ? colors.primary : '#8E8E93'}
                />
                {isCart && CART_BADGE > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{CART_BADGE}</Text>
                  </View>
                )}
              </View>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 50,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 16,
    width: '100%',
  },
  iconBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleActive: {
    backgroundColor: colors.primaryPale,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.white,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.white,
  },
  searchPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F2F2F7',
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  searchPillActive: {
    backgroundColor: colors.primaryPale,
  },
  searchText: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: '500',
  },
  searchTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
})
