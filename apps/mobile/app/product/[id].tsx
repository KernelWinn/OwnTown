'use client'
import { useState } from 'react'
import { View, ScrollView, Image, StyleSheet, TouchableOpacity, Dimensions } from 'react-native'
import { Text, Button, Icon, Chip } from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { formatPrice } from '@owntown/utils'
import { useCartStore } from '@/store/cart'
import { colors } from '@/constants/theme'
import type { Product } from '@owntown/types'

const { width } = Dimensions.get('window')

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [imgIndex, setImgIndex] = useState(0)
  const { items, addItem, updateQuantity } = useCartStore()

  const { data: product, isLoading } = useQuery<Product>({
    queryKey: ['product', id],
    queryFn: () => api.get(`/products/${id}`).then(r => r.data),
    enabled: !!id,
  })

  const cartItem = items.find(i => i.productId === id)
  const qty = cartItem?.quantity ?? 0
  const discount = product && product.mrp > product.price
    ? Math.round((1 - product.price / product.mrp) * 100)
    : 0

  if (isLoading || !product) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={{ color: colors.textSecondary }}>Loading...</Text>
        </View>
      </SafeAreaView>
    )
  }

  const images = product.images?.length ? product.images : []

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Back button */}
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Icon source="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>

        {/* Image carousel */}
        <View style={styles.imageWrap}>
          {images.length > 0 ? (
            <>
              <Image
                source={{ uri: images[imgIndex] }}
                style={styles.image}
                resizeMode="cover"
              />
              {images.length > 1 && (
                <View style={styles.dots}>
                  {images.map((_, i) => (
                    <TouchableOpacity key={i} onPress={() => setImgIndex(i)}>
                      <View style={[styles.dot, i === imgIndex && styles.dotActive]} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </>
          ) : (
            <View style={styles.imagePlaceholder}>
              <Icon source="image-off-outline" size={48} color={colors.textSecondary} />
            </View>
          )}
          {discount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{discount}% OFF</Text>
            </View>
          )}
        </View>

        {/* Product info */}
        <View style={styles.info}>
          <Text style={styles.name}>{product.name}</Text>
          <Text style={styles.unit}>{product.unit}</Text>

          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatPrice(product.price)}</Text>
            {discount > 0 && (
              <Text style={styles.mrp}>{formatPrice(product.mrp)}</Text>
            )}
            {discount > 0 && (
              <Chip compact style={styles.discountChip} textStyle={styles.discountChipText}>
                {discount}% off
              </Chip>
            )}
          </View>

          {product.description ? (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>About this product</Text>
              <Text style={styles.description}>{product.description}</Text>
            </View>
          ) : null}

          {product.stockQuantity <= (product.lowStockThreshold ?? 10) && (
            <View style={styles.stockWarn}>
              <Icon source="alert-circle-outline" size={16} color={colors.warning} />
              <Text style={styles.stockWarnText}>
                Only {product.stockQuantity} left in stock
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.footer}>
        {qty === 0 ? (
          <Button
            mode="contained"
            style={styles.addBtn}
            contentStyle={styles.btnContent}
            onPress={() => addItem({
              productId: product.id,
              name: product.name,
              unit: product.unit,
              imageUrl: product.images?.[0] ?? null,
              price: product.price,
              mrp: product.mrp,
            })}
          >
            Add to Cart
          </Button>
        ) : (
          <View style={styles.qtyWrap}>
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => updateQuantity(product.id, qty - 1)}
            >
              <Icon source="minus" size={20} color={colors.primary} />
            </TouchableOpacity>
            <Text style={styles.qtyText}>{qty} in cart</Text>
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => updateQuantity(product.id, qty + 1)}
            >
              <Icon source="plus" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
        )}
        <Button
          mode="outlined"
          style={styles.cartBtn}
          contentStyle={styles.btnContent}
          onPress={() => router.push('/(tabs)/cart')}
        >
          View Cart
        </Button>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  backBtn: {
    position: 'absolute', top: 16, left: 16, zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 20, padding: 8,
  },

  // Image
  imageWrap: { position: 'relative' },
  image: { width, height: width * 0.75 },
  imagePlaceholder: {
    width, height: width * 0.75,
    backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center',
  },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingVertical: 10 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.primary, width: 18 },
  badge: {
    position: 'absolute', top: 16, right: 16,
    backgroundColor: colors.error, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4,
  },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '800' },

  // Info
  info: { padding: 20, gap: 8 },
  name: { fontSize: 22, fontWeight: '800', color: colors.text, lineHeight: 28 },
  unit: { fontSize: 14, color: colors.textSecondary },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  price: { fontSize: 24, fontWeight: '800', color: colors.text },
  mrp: { fontSize: 16, color: colors.textSecondary, textDecorationLine: 'line-through' },
  discountChip: { backgroundColor: '#DCFCE7' },
  discountChipText: { color: '#16A34A', fontSize: 12, fontWeight: '700' },
  section: { gap: 6, marginTop: 8 },
  sectionLabel: { fontSize: 14, fontWeight: '700', color: colors.text },
  description: { fontSize: 14, color: colors.textSecondary, lineHeight: 22 },
  stockWarn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#FEF3C7', padding: 10, borderRadius: 8,
  },
  stockWarnText: { fontSize: 13, color: colors.warning, fontWeight: '600' },

  // Footer
  footer: {
    padding: 16, gap: 10, backgroundColor: '#fff',
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  addBtn: { borderRadius: 12 },
  cartBtn: { borderRadius: 12 },
  btnContent: { paddingVertical: 6 },
  qtyWrap: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 2, borderColor: colors.primary, borderRadius: 12, paddingHorizontal: 8,
  },
  qtyBtn: { padding: 10 },
  qtyText: { fontSize: 16, fontWeight: '700', color: colors.primary },
})
