import { useState, useRef } from 'react'
import {
  ScrollView, View, StyleSheet,
  TouchableOpacity, Dimensions, Image, FlatList,
} from 'react-native'
import { Text, Icon } from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { colors } from '@/constants/theme'
import { ProductCard } from '@/components/ProductCard'
import { CategoryPill } from '@/components/CategoryPill'
import { useCartStore } from '@/store/cart'
import type { Product, Category } from '@owntown/types'

const { width } = Dimensions.get('window')
const CARD_WIDTH = (width - 48) / 2   // 2-col grid with padding
const BANNER_WIDTH = width - 32

interface Banner {
  id: string
  title: string
  subtitle: string | null
  imageUrl: string
  deepLink: string | null
}

function BannerCarousel({ banners }: { banners: Banner[] }) {
  const [activeIndex, setActiveIndex] = useState(0)

  if (!banners.length) return null

  return (
    <View style={bannerStyles.container}>
      <FlatList
        data={banners}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={b => b.id}
        onMomentumScrollEnd={e => {
          setActiveIndex(Math.round(e.nativeEvent.contentOffset.x / BANNER_WIDTH))
        }}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.95}
            style={bannerStyles.slide}
            onPress={() => {
              if (!item.deepLink) return
              if (item.deepLink.startsWith('product/')) router.push(`/${item.deepLink}` as any)
              else if (item.deepLink.startsWith('categories')) router.push('/(tabs)/search' as any)
            }}
          >
            <Image source={{ uri: item.imageUrl }} style={bannerStyles.image} resizeMode="cover" />
            <View style={bannerStyles.overlay}>
              <Text style={bannerStyles.title}>{item.title}</Text>
              {item.subtitle && <Text style={bannerStyles.subtitle}>{item.subtitle}</Text>}
            </View>
          </TouchableOpacity>
        )}
      />
      {banners.length > 1 && (
        <View style={bannerStyles.dots}>
          {banners.map((_, i) => (
            <View key={i} style={[bannerStyles.dot, i === activeIndex && bannerStyles.dotActive]} />
          ))}
        </View>
      )}
    </View>
  )
}

const bannerStyles = StyleSheet.create({
  container: { marginHorizontal: 16, marginTop: 12 },
  slide: {
    width: BANNER_WIDTH, height: 140, borderRadius: 14, overflow: 'hidden',
    backgroundColor: colors.border,
  },
  image: { width: '100%', height: '100%' },
  overlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.35)', padding: 12,
  },
  title: { color: '#fff', fontSize: 15, fontWeight: '700' },
  subtitle: { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 2 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 4, marginTop: 8 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.primary, width: 16 },
})

export default function HomeScreen() {
  const [selectedCat, setSelectedCat] = useState<string | null>(null)
  const { itemCount } = useCartStore()

  const { data: banners = [] } = useQuery<Banner[]>({
    queryKey: ['banners'],
    queryFn: () => api.get('/banners').then(r => r.data),
  })

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => api.get('/products/categories').then(r => r.data),
  })

  const { data: featured = [] } = useQuery<Product[]>({
    queryKey: ['featured-products'],
    queryFn: () => api.get('/products?featured=true&limit=10').then(r => r.data),
  })

  const { data: catProducts = [] } = useQuery<Product[]>({
    queryKey: ['products', selectedCat],
    queryFn: () =>
      api.get(`/products?categoryId=${selectedCat}&limit=20`).then(r => r.data),
    enabled: !!selectedCat,
  })

  const displayProducts = selectedCat ? catProducts : featured

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} stickyHeaderIndices={[2]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.brand}>OwnTown</Text>
              <Text style={styles.tagline}>Fresh groceries, fast delivery</Text>
            </View>
            <TouchableOpacity
              style={styles.cartBtn}
              onPress={() => router.push('/(tabs)/cart')}
            >
              <Icon source="cart-outline" size={24} color="#fff" />
              {itemCount > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{itemCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.searchBox}
            onPress={() => router.push('/(tabs)/search')}
            activeOpacity={0.8}
          >
            <Icon source="magnify" size={16} color={colors.textSecondary} />
            <Text style={styles.searchPlaceholder}>Search for groceries...</Text>
          </TouchableOpacity>
        </View>

        {/* Banner carousel */}
        <BannerCarousel banners={banners} />

        {/* Categories row — sticky */}
        <View style={styles.categoriesWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesRow}
          >
            <TouchableOpacity
              style={[styles.allPill, !selectedCat && styles.allPillSelected]}
              onPress={() => setSelectedCat(null)}
            >
              <Text style={[styles.allPillText, !selectedCat && styles.allPillTextSelected]}>
                All
              </Text>
            </TouchableOpacity>
            {categories.map(cat => (
              <CategoryPill
                key={cat.id}
                category={cat}
                selected={selectedCat === cat.id}
                onPress={() => setSelectedCat(cat.id === selectedCat ? null : cat.id)}
              />
            ))}
          </ScrollView>
        </View>

        {/* Section title */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {selectedCat
              ? categories.find(c => c.id === selectedCat)?.name ?? 'Products'
              : 'Featured Products'
            }
          </Text>
        </View>

        {/* Product grid */}
        <View style={styles.grid}>
          {displayProducts.map((product) => (
            <View key={product.id} style={{ width: CARD_WIDTH }}>
              <ProductCard product={product} />
            </View>
          ))}
          {displayProducts.length === 0 && (
            <View style={styles.empty}>
              <Text style={{ color: colors.textSecondary }}>No products found</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  // Header
  header: { backgroundColor: colors.primary, padding: 16, paddingBottom: 20, gap: 12 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  brand: { color: '#fff', fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  tagline: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 },
  cartBtn: { position: 'relative', padding: 4 },
  cartBadge: {
    position: 'absolute', top: 0, right: 0,
    backgroundColor: colors.secondary,
    borderRadius: 8, minWidth: 16, height: 16,
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: 2,
  },
  cartBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchPlaceholder: { color: colors.textSecondary, fontSize: 14 },

  // Categories
  categoriesWrap: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: colors.border },
  categoriesRow: { paddingHorizontal: 12, paddingVertical: 10, gap: 8, flexDirection: 'row' },
  allPill: {
    height: 36, paddingHorizontal: 16, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: colors.background, borderWidth: 1.5, borderColor: colors.border,
  },
  allPillSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  allPillText: { fontSize: 13, fontWeight: '600', color: colors.text },
  allPillTextSelected: { color: '#fff' },

  // Section
  sectionHeader: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.text },

  // Grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingBottom: 24,
  },
  empty: { flex: 1, alignItems: 'center', paddingVertical: 40 },
})
