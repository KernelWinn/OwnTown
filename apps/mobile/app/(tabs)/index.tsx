import { ScrollView, View, StyleSheet } from 'react-native'
import { Text } from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { colors } from '@/constants/theme'

export default function HomeScreen() {
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/products/categories').then(r => r.data),
  })

  const { data: featured } = useQuery({
    queryKey: ['featured-products'],
    queryFn: () => api.get('/products?featured=true&limit=10').then(r => r.data),
  })

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text variant="titleLarge" style={styles.brand}>OwnTown</Text>
          <Text variant="bodyMedium" style={styles.tagline}>Delivered to your door</Text>
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>Shop by Category</Text>
          {/* CategoryGrid component will go here */}
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>Categories loading...</Text>
          </View>
        </View>

        {/* Featured Products */}
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>Featured Products</Text>
          {/* ProductGrid component will go here */}
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>Products loading...</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f8' },
  header: { backgroundColor: colors.primary, padding: 20, paddingBottom: 24 },
  brand: { color: '#fff', fontWeight: 'bold' },
  tagline: { color: 'rgba(255,255,255,0.85)' },
  section: { padding: 16, gap: 12 },
  sectionTitle: { fontWeight: '700', color: colors.text },
  placeholder: {
    height: 120,
    backgroundColor: '#fff',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: { color: colors.textSecondary },
})
