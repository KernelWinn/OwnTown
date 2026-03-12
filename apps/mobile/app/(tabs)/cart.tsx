import { View, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native'
import { Text, Button, Icon, Divider } from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useCartStore } from '@/store/cart'
import { formatPrice } from '@owntown/utils'
import { colors } from '@/constants/theme'

export default function CartScreen() {
  const { items, total, itemCount, updateQuantity, removeItem, clearCart } = useCartStore()

  if (itemCount === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.empty}>
          <Icon source="cart-off" size={56} color={colors.textSecondary} />
          <Text variant="titleMedium" style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>Add items to get started</Text>
          <Button
            mode="contained"
            style={styles.shopBtn}
            onPress={() => router.push('/(tabs)')}
          >
            Shop Now
          </Button>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Cart ({itemCount} items)</Text>
        <TouchableOpacity onPress={clearCart}>
          <Text style={styles.clearText}>Clear All</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        keyExtractor={item => item.productId}
        renderItem={({ item }) => (
          <View style={styles.item}>
            {/* Thumbnail */}
            {item.imageUrl ? (
              <Image source={{ uri: item.imageUrl }} style={styles.thumb} resizeMode="cover" />
            ) : (
              <View style={[styles.thumb, styles.thumbPlaceholder]}>
                <Icon source="leaf" size={20} color={colors.textSecondary} />
              </View>
            )}

            {/* Info */}
            <View style={styles.itemInfo}>
              <Text numberOfLines={2} style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemUnit}>{item.unit}</Text>
              <Text style={styles.itemUnitPrice}>{formatPrice(item.price)} each</Text>
            </View>

            {/* Qty + price */}
            <View style={styles.itemRight}>
              <Text style={styles.itemTotal}>{formatPrice(item.totalPrice)}</Text>
              <View style={styles.qtyRow}>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => updateQuantity(item.productId, item.quantity - 1)}
                >
                  <Icon
                    source={item.quantity === 1 ? 'trash-can-outline' : 'minus'}
                    size={15}
                    color={item.quantity === 1 ? colors.error : colors.primary}
                  />
                </TouchableOpacity>
                <Text style={styles.qtyText}>{item.quantity}</Text>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => updateQuantity(item.productId, item.quantity + 1)}
                >
                  <Icon source="plus" size={15} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
        ItemSeparatorComponent={() => <Divider />}
        contentContainerStyle={styles.list}
      />

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>{formatPrice(total)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Delivery</Text>
          <Text style={[styles.summaryValue, { color: colors.success }]}>FREE</Text>
        </View>
        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatPrice(total)}</Text>
        </View>
        <Button
          mode="contained"
          onPress={() => router.push('/checkout')}
          style={styles.checkoutButton}
          contentStyle={styles.buttonContent}
          icon="arrow-right"
        >
          Proceed to Checkout
        </Button>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  // Empty state
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 32 },
  emptyTitle: { fontWeight: '700', color: colors.text },
  emptySubtitle: { color: colors.textSecondary, marginBottom: 8 },
  shopBtn: { borderRadius: 12, marginTop: 4 },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  title: { fontSize: 17, fontWeight: '700', color: colors.text },
  clearText: { fontSize: 13, color: colors.error, fontWeight: '600' },

  // List
  list: { backgroundColor: '#fff' },
  item: {
    flexDirection: 'row', alignItems: 'center',
    padding: 14, gap: 12, backgroundColor: '#fff',
  },
  thumb: { width: 56, height: 56, borderRadius: 10 },
  thumbPlaceholder: {
    backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center',
  },
  itemInfo: { flex: 1, gap: 2 },
  itemName: { fontSize: 13, fontWeight: '600', color: colors.text, lineHeight: 18 },
  itemUnit: { fontSize: 11, color: colors.textSecondary },
  itemUnitPrice: { fontSize: 11, color: colors.textSecondary },
  itemRight: { alignItems: 'flex-end', gap: 6 },
  itemTotal: { fontSize: 14, fontWeight: '700', color: colors.text },
  qtyRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: colors.primary, borderRadius: 8,
  },
  qtyBtn: { padding: 5 },
  qtyText: { fontSize: 13, fontWeight: '700', color: colors.primary, minWidth: 22, textAlign: 'center' },

  // Footer
  footer: {
    padding: 16, backgroundColor: '#fff', gap: 8,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { fontSize: 14, color: colors.textSecondary },
  summaryValue: { fontSize: 14, fontWeight: '600', color: colors.text },
  totalRow: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8, marginTop: 2 },
  totalLabel: { fontSize: 16, fontWeight: '700', color: colors.text },
  totalValue: { fontSize: 16, fontWeight: '800', color: colors.primary },
  checkoutButton: { borderRadius: 12, marginTop: 4 },
  buttonContent: { paddingVertical: 6 },
})
