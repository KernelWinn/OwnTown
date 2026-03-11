import { View, StyleSheet, FlatList } from 'react-native'
import { Text, Chip } from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { formatPrice, formatDate } from '@owntown/utils'
import { colors, statusColors } from '@/constants/theme'
import type { Order } from '@owntown/types'

export default function OrdersScreen() {
  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ['orders'],
    queryFn: () => api.get('/orders').then(r => r.data),
  })

  return (
    <SafeAreaView style={styles.container}>
      <Text variant="headlineSmall" style={styles.title}>My Orders</Text>
      {isLoading ? (
        <View style={styles.center}>
          <Text style={{ color: colors.textSecondary }}>Loading orders...</Text>
        </View>
      ) : (
        <FlatList
          data={orders ?? []}
          keyExtractor={o => o.id}
          renderItem={({ item }) => (
            <View style={styles.card} onTouchEnd={() => router.push(`/order/${item.id}`)}>
              <View style={styles.cardHeader}>
                <Text variant="labelLarge" style={styles.orderNumber}>{item.orderNumber}</Text>
                <Chip
                  compact
                  style={{ backgroundColor: statusColors[item.status] ?? colors.border }}
                  textStyle={{ color: '#fff', fontSize: 11 }}
                >
                  {item.status.replace(/_/g, ' ').toUpperCase()}
                </Chip>
              </View>
              <Text variant="bodyMedium" style={styles.date}>{formatDate(item.createdAt)}</Text>
              <Text variant="titleMedium" style={styles.total}>{formatPrice(item.total)}</Text>
            </View>
          )}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={{ color: colors.textSecondary }}>No orders yet</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f8' },
  title: { padding: 16, fontWeight: 'bold', color: colors.text },
  list: { padding: 16, gap: 12 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, gap: 6 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderNumber: { fontWeight: '700', color: colors.text },
  date: { color: colors.textSecondary },
  total: { fontWeight: '700', color: colors.primary },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
})
