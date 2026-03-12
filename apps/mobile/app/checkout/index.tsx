import { useState } from 'react'
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native'
import { Text, Button, RadioButton, Icon, ActivityIndicator } from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { formatPrice } from '@owntown/utils'
import { useCartStore } from '@/store/cart'
import { colors } from '@/constants/theme'
import type { Address, DeliverySlot } from '@owntown/types'

export default function CheckoutScreen() {
  const [selectedAddress, setSelectedAddress] = useState<string>('')
  const [selectedSlot, setSelectedSlot] = useState<string>('')
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'razorpay'>('cod')
  const { total, itemCount, clearCart } = useCartStore()

  const { data: addresses = [], isLoading: addrLoading } = useQuery<Address[]>({
    queryKey: ['addresses'],
    queryFn: () => api.get('/addresses').then(r => r.data),
  })

  const { data: slots = [], isLoading: slotsLoading } = useQuery<DeliverySlot[]>({
    queryKey: ['delivery-slots'],
    queryFn: () => api.get('/orders/slots').then(r => r.data),
  })

  const placeMutation = useMutation({
    mutationFn: () =>
      api.post('/orders', {
        addressId: selectedAddress,
        deliverySlotId: selectedSlot,
        paymentMethod,
      }).then(r => r.data),
    onSuccess: ({ order }) => {
      clearCart()
      router.replace(`/order/${order.id}?new=true`)
    },
  })

  const canPlace = !!selectedAddress && !!selectedSlot && itemCount > 0

  // Group slots by date
  const slotsByDate = slots.reduce<Record<string, DeliverySlot[]>>((acc, s) => {
    const d = s.date
    acc[d] = acc[d] ? [...acc[d], s] : [s]
    return acc
  }, {})

  const formatSlotTime = (s: DeliverySlot) =>
    `${s.startTime.slice(0, 5)} – ${s.endTime.slice(0, 5)}`

  const formatSlotDate = (dateStr: string) => {
    const d = new Date(dateStr)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)
    if (d.toDateString() === today.toDateString()) return 'Today'
    if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow'
    return d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Icon source="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Address */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
            <TouchableOpacity onPress={() => router.push('/addresses/new')}>
              <Text style={styles.addLink}>+ Add New</Text>
            </TouchableOpacity>
          </View>

          {addrLoading ? (
            <ActivityIndicator color={colors.primary} />
          ) : addresses.length === 0 ? (
            <TouchableOpacity
              style={styles.emptyCard}
              onPress={() => router.push('/addresses/new')}
            >
              <Icon source="map-marker-plus-outline" size={24} color={colors.primary} />
              <Text style={styles.emptyCardText}>Add a delivery address</Text>
            </TouchableOpacity>
          ) : (
            addresses.map(addr => (
              <TouchableOpacity
                key={addr.id}
                style={[styles.addrCard, selectedAddress === addr.id && styles.selectedCard]}
                onPress={() => setSelectedAddress(addr.id)}
              >
                <RadioButton
                  value={addr.id}
                  status={selectedAddress === addr.id ? 'checked' : 'unchecked'}
                  onPress={() => setSelectedAddress(addr.id)}
                  color={colors.primary}
                />
                <View style={styles.addrInfo}>
                  <Text style={styles.addrLabel}>{addr.label ?? addr.name}</Text>
                  <Text style={styles.addrText} numberOfLines={2}>
                    {addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}, {addr.city} – {addr.pincode}
                  </Text>
                  <Text style={styles.addrPhone}>{addr.phone}</Text>
                </View>
                {addr.isDefault && (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultBadgeText}>Default</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Delivery Slots */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Slot</Text>
          {slotsLoading ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            Object.entries(slotsByDate).map(([date, daySlots]) => (
              <View key={date}>
                <Text style={styles.dateLabel}>{formatSlotDate(date)}</Text>
                <View style={styles.slotsRow}>
                  {daySlots.map(slot => {
                    const full = slot.currentOrders >= slot.maxOrders
                    const sel = selectedSlot === slot.id
                    return (
                      <TouchableOpacity
                        key={slot.id}
                        style={[styles.slotChip, sel && styles.slotChipSelected, full && styles.slotChipFull]}
                        onPress={() => !full && setSelectedSlot(slot.id)}
                        disabled={full}
                      >
                        <Text style={[styles.slotTime, sel && styles.slotTimeSelected, full && styles.slotTimeFull]}>
                          {formatSlotTime(slot)}
                        </Text>
                        {full && <Text style={styles.slotFull}>Full</Text>}
                      </TouchableOpacity>
                    )
                  })}
                </View>
              </View>
            ))
          )}
        </View>

        {/* Payment method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <TouchableOpacity
            style={[styles.payCard, paymentMethod === 'cod' && styles.selectedCard]}
            onPress={() => setPaymentMethod('cod')}
          >
            <RadioButton
              value="cod"
              status={paymentMethod === 'cod' ? 'checked' : 'unchecked'}
              onPress={() => setPaymentMethod('cod')}
              color={colors.primary}
            />
            <Icon source="cash" size={20} color={colors.text} />
            <View style={styles.payInfo}>
              <Text style={styles.payTitle}>Cash on Delivery</Text>
              <Text style={styles.paySubtitle}>Pay when your order arrives</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.payCard, paymentMethod === 'razorpay' && styles.selectedCard]}
            onPress={() => setPaymentMethod('razorpay')}
          >
            <RadioButton
              value="razorpay"
              status={paymentMethod === 'razorpay' ? 'checked' : 'unchecked'}
              onPress={() => setPaymentMethod('razorpay')}
              color={colors.primary}
            />
            <Icon source="credit-card-outline" size={20} color={colors.text} />
            <View style={styles.payInfo}>
              <Text style={styles.payTitle}>UPI / Card / Wallet</Text>
              <Text style={styles.paySubtitle}>Pay securely via Razorpay</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal ({itemCount} items)</Text>
            <Text style={styles.summaryValue}>{formatPrice(total)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery Fee</Text>
            <Text style={[styles.summaryValue, { color: colors.success }]}>FREE</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatPrice(total)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Place order button */}
      <View style={styles.footer}>
        {placeMutation.isError && (
          <Text style={styles.errorText}>Something went wrong. Please try again.</Text>
        )}
        <Button
          mode="contained"
          disabled={!canPlace || placeMutation.isPending}
          loading={placeMutation.isPending}
          onPress={() => placeMutation.mutate()}
          style={styles.placeBtn}
          contentStyle={styles.placeBtnContent}
        >
          {placeMutation.isPending ? 'Placing Order...' : `Place Order · ${formatPrice(total)}`}
        </Button>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 16, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  scroll: { padding: 16, gap: 16, paddingBottom: 8 },

  section: {
    backgroundColor: '#fff', borderRadius: 14,
    padding: 16, gap: 12,
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  addLink: { fontSize: 13, color: colors.primary, fontWeight: '600' },

  // Address
  emptyCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1.5, borderColor: colors.primary, borderRadius: 10,
    borderStyle: 'dashed', padding: 16, justifyContent: 'center',
  },
  emptyCardText: { color: colors.primary, fontWeight: '600' },
  addrCard: {
    flexDirection: 'row', alignItems: 'flex-start',
    borderWidth: 1.5, borderColor: colors.border, borderRadius: 10, padding: 12, gap: 8,
  },
  selectedCard: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  addrInfo: { flex: 1, gap: 2 },
  addrLabel: { fontSize: 13, fontWeight: '700', color: colors.text },
  addrText: { fontSize: 12, color: colors.textSecondary, lineHeight: 18 },
  addrPhone: { fontSize: 12, color: colors.textSecondary },
  defaultBadge: {
    backgroundColor: colors.primary + '20', borderRadius: 4,
    paddingHorizontal: 6, paddingVertical: 2, alignSelf: 'flex-start',
  },
  defaultBadgeText: { fontSize: 10, color: colors.primary, fontWeight: '700' },

  // Slots
  dateLabel: { fontSize: 13, fontWeight: '700', color: colors.textSecondary, marginBottom: 8 },
  slotsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slotChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8,
    borderWidth: 1.5, borderColor: colors.border, backgroundColor: '#fff',
  },
  slotChipSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  slotChipFull: { borderColor: colors.border, backgroundColor: colors.background, opacity: 0.5 },
  slotTime: { fontSize: 13, fontWeight: '600', color: colors.text },
  slotTimeSelected: { color: colors.primary },
  slotTimeFull: { color: colors.textSecondary },
  slotFull: { fontSize: 10, color: colors.textSecondary, textAlign: 'center' },

  // Payment
  payCard: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: colors.border, borderRadius: 10, padding: 12, gap: 10,
  },
  payInfo: { flex: 1 },
  payTitle: { fontSize: 14, fontWeight: '600', color: colors.text },
  paySubtitle: { fontSize: 12, color: colors.textSecondary },

  // Summary
  summaryCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16, gap: 10,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { fontSize: 14, color: colors.textSecondary },
  summaryValue: { fontSize: 14, fontWeight: '600', color: colors.text },
  totalRow: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10, marginTop: 2 },
  totalLabel: { fontSize: 16, fontWeight: '700', color: colors.text },
  totalValue: { fontSize: 16, fontWeight: '800', color: colors.primary },

  // Footer
  footer: { padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: colors.border },
  errorText: { color: colors.error, fontSize: 13, marginBottom: 8, textAlign: 'center' },
  placeBtn: { borderRadius: 12 },
  placeBtnContent: { paddingVertical: 6 },
})
