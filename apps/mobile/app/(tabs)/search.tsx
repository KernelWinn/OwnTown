import { useState } from 'react'
import { View, StyleSheet, FlatList } from 'react-native'
import { Searchbar, Text } from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { colors } from '@/constants/theme'
import type { Product } from '@owntown/types'

export default function SearchScreen() {
  const [query, setQuery] = useState('')

  const { data: results, isLoading } = useQuery<Product[]>({
    queryKey: ['search', query],
    queryFn: () => api.get(`/products/search?q=${encodeURIComponent(query)}`).then(r => r.data),
    enabled: query.length >= 2,
  })

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchBar}>
        <Searchbar
          placeholder="Search groceries..."
          value={query}
          onChangeText={setQuery}
          style={styles.input}
          autoFocus
        />
      </View>
      {query.length < 2 ? (
        <View style={styles.hint}>
          <Text style={{ color: colors.textSecondary }}>Type at least 2 characters to search</Text>
        </View>
      ) : isLoading ? (
        <View style={styles.hint}>
          <Text style={{ color: colors.textSecondary }}>Searching...</Text>
        </View>
      ) : (
        <FlatList
          data={results ?? []}
          keyExtractor={p => p.id}
          renderItem={({ item }) => (
            <View style={styles.result}>
              <Text variant="bodyLarge" style={styles.productName}>{item.name}</Text>
              <Text variant="bodySmall" style={styles.unit}>{item.unit}</Text>
            </View>
          )}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.hint}>
              <Text style={{ color: colors.textSecondary }}>No results found</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f8' },
  searchBar: { padding: 16, backgroundColor: '#fff' },
  input: { backgroundColor: '#f3f4f6' },
  list: { padding: 16, gap: 8 },
  result: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
    gap: 2,
  },
  productName: { fontWeight: '600', color: colors.text },
  unit: { color: colors.textSecondary },
  hint: { flex: 1, justifyContent: 'center', alignItems: 'center' },
})
