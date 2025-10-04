import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, ImageBackground, Dimensions, Animated, PanResponder, Easing, Platform } from 'react-native'

// Types for data coming from existing backend fetch functions
export type VehicleType = 'bus' | 'train' | 'bike' | 'scooter'

export interface VehicleMarker {
  id: string
  type: VehicleType
  lat: number
  lng: number
}

export interface RoutePolyline {
  id: string
  color: string
  coordinates: Array<{ lat: number; lng: number }>
}

export interface NearbyRouteCard {
  id: string
  color: string // hex
  shortName: string // route number/letter
  destination: string
  stopInfo: string
  etaMinutes: number
}

type FetchVehiclesFn = (lat: number, lng: number) => Promise<VehicleMarker[]>
type FetchPolylinesFn = () => Promise<RoutePolyline[]>
type FetchNearbyRoutesFn = (lat: number, lng: number) => Promise<NearbyRouteCard[]>

interface TransitHomeScreenProps {
  // Wire these to your existing backend functions (do not modify them)
  fetchVehicles: FetchVehiclesFn
  fetchPolylines: FetchPolylinesFn
  fetchNearbyRoutes: FetchNearbyRoutesFn

  // Initial user location (pass from native location hook)
  userLat: number
  userLng: number

  // Optional: use root screenshot as background for design alignment
  // Place a copy named "transitss" in your RN project assets and pass it via require(...)
  screenshotSource?: any
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window')

const CARD_COLORS_FALLBACK = ['#3B82F6', '#F59E0B', '#FDE047', '#22C55E']

export default function TransitHomeScreen({
  fetchVehicles,
  fetchPolylines,
  fetchNearbyRoutes,
  userLat,
  userLng,
  screenshotSource,
}: TransitHomeScreenProps) {
  const [vehicles, setVehicles] = useState<VehicleMarker[]>([])
  const [polylines, setPolylines] = useState<RoutePolyline[]>([])
  const [routeCards, setRouteCards] = useState<NearbyRouteCard[]>([])
  const [homeEta, setHomeEta] = useState<number>(32)

  // Bottom sheet animated state
  const sheetHeightExpanded = Math.min(420, SCREEN_HEIGHT * 0.52)
  const sheetHeightCollapsed = 140
  const sheetY = useRef(new Animated.Value(SCREEN_HEIGHT)).current
  const isExpanded = useRef(false)

  const animateSheetTo = useCallback((toOpen: boolean) => {
    isExpanded.current = toOpen
    Animated.timing(sheetY, {
      toValue: SCREEN_HEIGHT - (toOpen ? sheetHeightExpanded : sheetHeightCollapsed),
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start()
  }, [SCREEN_HEIGHT, sheetHeightCollapsed, sheetHeightExpanded, sheetY])

  useEffect(() => {
    // initial position
    sheetY.setValue(SCREEN_HEIGHT - sheetHeightCollapsed)
  }, [SCREEN_HEIGHT, sheetY])

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderMove: (_, gesture) => {
          const target = SCREEN_HEIGHT - sheetHeightCollapsed + gesture.dy
          if (target >= SCREEN_HEIGHT - sheetHeightExpanded && target <= SCREEN_HEIGHT - 80) {
            sheetY.setValue(target)
          }
        },
        onPanResponderRelease: (_, gesture) => {
          const shouldOpen = gesture.vy < 0 || gesture.moveY < SCREEN_HEIGHT - sheetHeightExpanded / 2
          animateSheetTo(shouldOpen)
        },
      }),
    [SCREEN_HEIGHT, sheetHeightCollapsed, sheetHeightExpanded, sheetY, animateSheetTo]
  )

  // Load map data – uses existing backend integrations via props
  const loadData = useCallback(async () => {
    try {
      const [v, p, r] = await Promise.all([
        fetchVehicles(userLat, userLng),
        fetchPolylines(),
        fetchNearbyRoutes(userLat, userLng),
      ])
      setVehicles(v || [])
      setPolylines(p || [])
      setRouteCards(r || [])
      // Example: compute ETA to home using first card or backend later
      if (r && r.length > 0) setHomeEta(Math.max(1, Math.min(99, r[0].etaMinutes)))
    } catch (_e) {
      // Keep UI responsive even if fetch fails
      setVehicles([])
      setPolylines([])
      setRouteCards(
        [0, 1, 2, 3, 4].map((i) => ({
          id: `fallback-${i}`,
          color: CARD_COLORS_FALLBACK[i % CARD_COLORS_FALLBACK.length],
          shortName: ['38', '91', '12', '23', 'LRT'][i % 5],
          destination: ['Meskel Sq', 'Bole', 'Merkato', 'Piazza', 'CMC'][i % 5],
          stopInfo: 'Next stop in 350 m',
          etaMinutes: [3, 5, 7, 11, 13][i % 5],
        }))
      )
    }
  }, [fetchVehicles, fetchPolylines, fetchNearbyRoutes, userLat, userLng])

  useEffect(() => {
    loadData()
    const id = setInterval(loadData, 30000)
    return () => clearInterval(id)
  }, [loadData])

  const renderCard = ({ item }: { item: NearbyRouteCard }) => (
    <View style={[styles.card, styles.shadow, { borderColor: '#E5E7EB' }]}
      accessibilityRole="button"
    >
      <View style={[styles.cardStripe, { backgroundColor: item.color }]} />
      <View style={styles.cardRow}>
        <View style={[styles.badge, { backgroundColor: item.color }]}>
          <Text style={styles.badgeText}>{item.shortName}</Text>
        </View>
        <View style={styles.cardMid}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.destination}</Text>
          <Text style={styles.cardSub} numberOfLines={1}>{item.stopInfo}</Text>
        </View>
        <View style={styles.cardEtaWrap}>
          <Text style={styles.cardEta}>{item.etaMinutes}</Text>
          <Text style={styles.cardEtaUnit}>min</Text>
        </View>
      </View>
    </View>
  )

  return (
    <View style={styles.container}>
      {/* Map container – if you have Mapbox in your RN app, render it here. Otherwise, show screenshot for visual clone. */}
      {screenshotSource ? (
        <ImageBackground source={screenshotSource} resizeMode="cover" style={styles.mapBg}>
          <View style={styles.mapOverlay} />
        </ImageBackground>
      ) : (
        <View style={[styles.mapBg, { backgroundColor: '#E5F7EB' }]} />
      )}

      {/* Floating search bar (green) */}
      <View style={styles.searchWrap} pointerEvents="box-none">
        <View style={[styles.searchBar, styles.shadow]}
          accessibilityRole="search"
          accessibilityLabel="Where to?"
        >
          <View style={styles.searchLeft}>
            <Text style={styles.searchIcon}>🔍</Text>
            <Text style={styles.searchPlaceholder}>Where to?</Text>
          </View>
          <View style={styles.searchRight}>
            <Text style={styles.homeIcon}>🏠</Text>
            <Text style={styles.homeEta}>{homeEta} min</Text>
          </View>
        </View>
      </View>

      {/* Bottom sheet with route cards */}
      <Animated.View
        style={[styles.sheet, { top: sheetY }]}
        {...panResponder.panHandlers}
      >
        <View style={styles.sheetHandleWrap}>
          <View style={styles.sheetHandle} />
        </View>
        <FlatList
          data={routeCards}
          keyExtractor={(item) => item.id}
          renderItem={renderCard}
          contentContainerStyle={styles.cardList}
          showsVerticalScrollIndicator={false}
        />
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  mapBg: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  mapOverlay: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  searchWrap: {
    position: 'absolute',
    top: Platform.select({ ios: 56, android: 40, default: 40 }),
    left: 16,
    right: 16,
  },
  searchBar: {
    backgroundColor: '#2ECC71',
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  searchLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchIcon: {
    fontSize: 18,
    color: '#063D1E',
  },
  homeIcon: {
    fontSize: 18,
    color: '#063D1E',
  },
  searchPlaceholder: {
    color: '#05361B',
    fontSize: 16,
    fontWeight: '600',
  },
  homeEta: {
    color: '#05361B',
    fontSize: 16,
    fontWeight: '700',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    paddingHorizontal: 12,
  },
  sheetHandleWrap: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 8,
  },
  sheetHandle: {
    width: 48,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
  },
  cardList: {
    paddingBottom: 32,
    gap: 10,
  },
  card: {
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardStripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 6,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingLeft: 18,
    paddingRight: 12,
  },
  badge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  cardMid: {
    flex: 1,
    marginHorizontal: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 2,
  },
  cardSub: {
    fontSize: 14,
    color: '#6B7280',
  },
  cardEtaWrap: {
    alignItems: 'flex-end',
    minWidth: 56,
  },
  cardEta: {
    fontSize: 28,
    fontWeight: '900',
    color: '#111827',
    lineHeight: 28,
  },
  cardEtaUnit: {
    fontSize: 12,
    color: '#6B7280',
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
})











