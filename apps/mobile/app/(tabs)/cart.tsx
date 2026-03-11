import { View, StyleSheet, FlatList } from 'react-native'
import { Text, Button } from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useCartStore } from '@/store/cart'
import { formatPrice } from '@owntown/utils'
import { colors } from '@/constants/theme'

export default function CartScreen() {
  const { items, total, itemCount } = useCartStore()

  if (itemCount === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.empty}>
          <Text variant="titleMedium" style={styles.emptyText}>Your cart is empty</Text>
          <Button mode="contained" onPress={() => router.push('/(tabs)')}>
            Shop Now
          </Button>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text variant="headlineSmall" style={styles.title}>Your Cart ({itemCount})</Text>
      <FlatList
        data={items}
        keyExtractor={item => item.productId}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <View style={styles.itemInfo}>
              <Text variant="bodyLarge" style={styles.itemName}>{item.name}</Text>
              <Text variant="bodyMedium" style={styles.itemUnit}>{item.unit}</Text>
            </View>
            <Text variant="titleMedium" style={styles.itemPrice}>
              {formatPrice(item.totalPrice)}
            </Text>
          </View>
        )}
        contentContainerStyle={styles.list}
      />
      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text variant="titleMedium">Total</Text>
          <Text variant="titleMedium" style={styles.totalAmount}>{formatPrice(total)}</Text>
        </View>
        <Button
          mode="contained"
          onPress={() => router.push('/checkout')}
          style={styles.checkoutButton}
          contentStyle={styles.buttonContent}
        >
          Proceed to Checkout
        </Button>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f8' },
  title: { padding: 16, fontWeight: 'bold', color: colors.text },
  list: { padding: 16, gap: 8 },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
  },
  itemInfo: { flex: 1, gap: 2 },
  itemName: { fontWeight: '600', color: colors.text },
  itemUnit: { color: colors.textSecondary },
  itemPrice: { fontWeight: '700', color: colors.primary },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  emptyText: { color: colors.textSecondary },
  footer: { padding: 16, backgroundColor: '#fff', gap: 12, borderTopWidth: 1, borderTopColor: colors.border },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  totalAmount: { fontWeight: 'bold', color: colors.primary },
  checkoutButton: { borderRadius: 12 },
  buttonContent: { paddingVertical: 6 },
})
