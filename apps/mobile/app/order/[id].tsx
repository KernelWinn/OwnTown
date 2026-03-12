import { View, ScrollView, StyleSheet } from 'react-native'
import { Text, Chip, Icon, Divider } from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { TouchableOpacity } from 'react-native'
import { api } from '@/lib/api'
import { formatPrice, formatDate } from '@owntown/utils'
import { colors, statusColors } from '@/constants/theme'
import type { Order, OrderItem } from '@owntown/types'

const STATUS_STEPS = [
  'pending', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered',
] as const

export default function OrderDetailScreen() {
  const { id, new: isNew } = useLocalSearchParams<{ id: string; new?: string }>()

  const { data: order, isLoading } = useQuery<Order>({
    queryKey: ['order', id],
    queryFn: () => api.get(`/orders/${id}`).then(r => r.data),
    enabled: !!id,
  })

  if (isLoading || !order) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={{ color: colors.textSecondary }}>Loading order...</Text>
        </View>
      </SafeAreaView>
    )
  }

  const stepIndex = STATUS_STEPS.indexOf(order.status as any)
  const isCancelled = order.status === 'cancelled' || order.status === 'payment_failed'

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/(tabs)/orders')} style={styles.backBtn}>
          <Icon source="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Success banner for new orders */}
        {isNew === 'true' && (
          <View style={styles.successBanner}>
            <Icon source="check-circle" size={28} color={colors.success} />
            <View style={{ flex: 1 }}>
              <Text style={styles.successTitle}>Order Placed!</Text>
              <Text style={styles.successSub}>We'll notify you when it's packed.</Text>
            </View>
          </View>
        )}

        {/* Order header */}
        <View style={styles.card}>
          <View style={styles.orderHeaderRow}>
            <Text style={styles.orderNumber}>{order.orderNumber}</Text>
            <Chip
              compact
              style={{ backgroundColor: (statusColors as Record<string, string>)[order.status] ?? colors.border }}
              textStyle={{ color: '#fff', fontSize: 11, fontWeight: '700' }}
            >
              {order.status.replace(/_/g, ' ').toUpperCase()}
            </Chip>
          </View>
          <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
        </View>

        {/* Status timeline */}
        {!isCancelled && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Order Progress</Text>
            <View style={styles.timeline}>
              {STATUS_STEPS.map((step, i) => (
                <View key={step} style={styles.timelineStep}>
                  <View style={styles.timelineLeft}>
                    <View style={[
                      styles.timelineDot,
                      i <= stepIndex && styles.timelineDotDone,
                      i === stepIndex && styles.timelineDotActive,
                    ]} />
                    {i < STATUS_STEPS.length - 1 && (
                      <View style={[styles.timelineLine, i < stepIndex && styles.timelineLineDone]} />
                    )}
                  </View>
                  <Text style={[
                    styles.timelineLabel,
                    i <= stepIndex && styles.timelineLabelDone,
                  ]}>
                    {step.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Tracking */}
        {order.awbNumber && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Shipment Tracking</Text>
            <View style={styles.trackRow}>
              <Icon source="truck-outline" size={18} color={colors.primary} />
              <Text style={styles.trackLabel}>AWB: {order.awbNumber}</Text>
            </View>
            {order.trackingUrl && (
              <Text style={styles.trackSub}>{order.trackingUrl}</Text>
            )}
          </View>
        )}

        {/* Items */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Items ({order.items.length})</Text>
          {order.items.map((item: OrderItem, i: number) => (
            <View key={item.productId}>
              {i > 0 && <Divider style={{ marginVertical: 10 }} />}
              <View style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemUnit}>{item.unit} × {item.quantity}</Text>
                </View>
                <Text style={styles.itemPrice}>{formatPrice(item.totalPrice)}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Delivery address */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Delivery Address</Text>
          <Text style={styles.addrName}>{order.address.name}</Text>
          <Text style={styles.addrText}>
            {order.address.line1}
            {order.address.line2 ? `, ${order.address.line2}` : ''}
            {order.address.landmark ? `, Near ${order.address.landmark}` : ''}
          </Text>
          <Text style={styles.addrText}>
            {order.address.city}, {order.address.state} – {order.address.pincode}
          </Text>
          <Text style={styles.addrPhone}>{order.address.phone}</Text>
        </View>

        {/* Bill summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Bill Summary</Text>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Subtotal</Text>
            <Text style={styles.billValue}>{formatPrice(order.subtotal)}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Delivery Fee</Text>
            <Text style={[styles.billValue, { color: colors.success }]}>
              {order.deliveryFee === 0 ? 'FREE' : formatPrice(order.deliveryFee)}
            </Text>
          </View>
          <Divider style={{ marginVertical: 8 }} />
          <View style={styles.billRow}>
            <Text style={styles.billTotal}>Total</Text>
            <Text style={styles.billTotalValue}>{formatPrice(order.total)}</Text>
          </View>
          <Text style={styles.payMethod}>
            {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Paid via Razorpay'}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 16, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  scroll: { padding: 16, gap: 12, paddingBottom: 32 },

  successBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#DCFCE7', borderRadius: 14, padding: 16,
  },
  successTitle: { fontSize: 15, fontWeight: '700', color: colors.success },
  successSub: { fontSize: 13, color: '#166534' },

  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, gap: 8 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 4 },

  orderHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderNumber: { fontSize: 15, fontWeight: '800', color: colors.text },
  orderDate: { fontSize: 13, color: colors.textSecondary },

  // Timeline
  timeline: { gap: 0 },
  timelineStep: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  timelineLeft: { alignItems: 'center', width: 16 },
  timelineDot: {
    width: 14, height: 14, borderRadius: 7,
    borderWidth: 2, borderColor: colors.border, backgroundColor: '#fff',
  },
  timelineDotDone: { borderColor: colors.success, backgroundColor: colors.success },
  timelineDotActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  timelineLine: { width: 2, height: 28, backgroundColor: colors.border, marginTop: 0 },
  timelineLineDone: { backgroundColor: colors.success },
  timelineLabel: { fontSize: 13, color: colors.textSecondary, paddingVertical: 0, lineHeight: 14, marginBottom: 14 },
  timelineLabelDone: { color: colors.text, fontWeight: '600' },

  // Tracking
  trackRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  trackLabel: { fontSize: 14, fontWeight: '600', color: colors.text },
  trackSub: { fontSize: 12, color: colors.textSecondary },

  // Items
  itemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  itemInfo: { flex: 1, gap: 2 },
  itemName: { fontSize: 14, fontWeight: '600', color: colors.text },
  itemUnit: { fontSize: 12, color: colors.textSecondary },
  itemPrice: { fontSize: 14, fontWeight: '700', color: colors.text },

  // Address
  addrName: { fontSize: 14, fontWeight: '700', color: colors.text },
  addrText: { fontSize: 13, color: colors.textSecondary, lineHeight: 20 },
  addrPhone: { fontSize: 13, color: colors.textSecondary },

  // Bill
  billRow: { flexDirection: 'row', justifyContent: 'space-between' },
  billLabel: { fontSize: 14, color: colors.textSecondary },
  billValue: { fontSize: 14, fontWeight: '600', color: colors.text },
  billTotal: { fontSize: 15, fontWeight: '700', color: colors.text },
  billTotalValue: { fontSize: 15, fontWeight: '800', color: colors.primary },
  payMethod: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
})
