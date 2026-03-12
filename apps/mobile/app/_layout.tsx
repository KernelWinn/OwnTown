import { useEffect, useRef } from 'react'
import { Platform } from 'react-native'
import { Stack, router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { PaperProvider } from 'react-native-paper'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import { theme } from '@/constants/theme'
import { useAuthStore } from '@/store/auth'
import { api } from '@/lib/api'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 1000 * 60 * 5 },
  },
})

async function registerForPushNotifications() {
  if (!Device.isDevice) return  // skip in simulator

  const { status: existing } = await Notifications.getPermissionsAsync()
  let finalStatus = existing
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }
  if (finalStatus !== 'granted') return

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    })
  }

  try {
    const { data: token } = await Notifications.getDevicePushTokenAsync()
    const platform = Platform.OS as 'ios' | 'android'
    await api.post('/auth/fcm-token', { token, platform })
  } catch {
    // Token registration is non-critical — fail silently
  }
}

export default function RootLayout() {
  const { initialize, isAuthenticated } = useAuthStore()
  const notificationListener = useRef<Notifications.EventSubscription>()
  const responseListener = useRef<Notifications.EventSubscription>()

  useEffect(() => {
    initialize()
  }, [])

  useEffect(() => {
    if (!isAuthenticated) return

    // Register FCM token after login
    registerForPushNotifications()

    // Handle notification received while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(() => {
      // Badge/alert handled by setNotificationHandler above
    })

    // Handle tap on notification → deep link to order detail
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data as Record<string, string>
      if (data?.orderId) {
        router.push(`/order/${data.orderId}`)
      }
    })

    return () => {
      notificationListener.current?.remove()
      responseListener.current?.remove()
    }
  }, [isAuthenticated])

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <PaperProvider theme={theme}>
          <StatusBar style="auto" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="product/[id]" options={{ headerShown: true, title: '' }} />
            <Stack.Screen name="checkout/index" options={{ headerShown: true, title: 'Checkout' }} />
            <Stack.Screen name="order/[id]" options={{ headerShown: true, title: 'Order Details' }} />
          </Stack>
        </PaperProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  )
}
