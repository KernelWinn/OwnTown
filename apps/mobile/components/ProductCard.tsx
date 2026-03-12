import { View, StyleSheet, TouchableOpacity, Image } from 'react-native'
import { Text, Icon } from 'react-native-paper'
import { router } from 'expo-router'
import { formatPrice } from '@owntown/utils'
import { useCartStore } from '@/store/cart'
import { colors } from '@/constants/theme'
import type { Product } from '@owntown/types'

interface Props {
  product: Product
}

export function ProductCard({ product }: Props) {
  const { items, addItem, updateQuantity } = useCartStore()
  const cartItem = items.find(i => i.productId === product.id)
  const qty = cartItem?.quantity ?? 0

  const handleAdd = () => {
    addItem({
      productId: product.id,
      name: product.name,
      unit: product.unit,
      imageUrl: product.images?.[0] ?? null,
      price: product.price,
      mrp: product.mrp,
    })
  }

  const discount = product.mrp > product.price
    ? Math.round((1 - product.price / product.mrp) * 100)
    : 0

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/product/${product.id}`)}
      activeOpacity={0.85}
    >
      {/* Image */}
      <View style={styles.imageContainer}>
        {product.images?.[0] ? (
          <Image source={{ uri: product.images[0] }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Icon source="leaf" size={28} color={colors.textSecondary} />
          </View>
        )}
        {discount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{discount}% off</Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text numberOfLines={2} style={styles.name}>{product.name}</Text>
        <Text style={styles.unit}>{product.unit}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatPrice(product.price)}</Text>
          {discount > 0 && (
            <Text style={styles.mrp}>{formatPrice(product.mrp)}</Text>
          )}
        </View>
      </View>

      {/* Add / Qty controls */}
      {qty === 0 ? (
        <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
          <Icon source="plus" size={18} color="#fff" />
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.qtyRow}>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => updateQuantity(product.id, qty - 1)}
          >
            <Icon source="minus" size={16} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.qtyText}>{qty}</Text>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => updateQuantity(product.id, qty + 1)}
          >
            <Icon source="plus" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
    flex: 1,
    margin: 4,
  },
  imageContainer: { position: 'relative' },
  image: { width: '100%', height: 110 },
  imagePlaceholder: {
    width: '100%',
    height: 110,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: colors.error,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  info: { padding: 10, gap: 2, flex: 1 },
  name: { fontSize: 13, fontWeight: '600', color: colors.text, lineHeight: 18 },
  unit: { fontSize: 11, color: colors.textSecondary },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  price: { fontSize: 14, fontWeight: '700', color: colors.text },
  mrp: { fontSize: 11, color: colors.textSecondary, textDecorationLine: 'line-through' },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    margin: 10,
    marginTop: 0,
    borderRadius: 8,
    paddingVertical: 7,
    gap: 4,
  },
  addBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    margin: 10,
    marginTop: 0,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 2,
  },
  qtyBtn: { padding: 6 },
  qtyText: { fontSize: 14, fontWeight: '700', color: colors.primary },
})
