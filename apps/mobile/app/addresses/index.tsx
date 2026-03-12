import { View, FlatList, StyleSheet, TouchableOpacity } from 'react-native'
import { Text, Icon, Button } from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { colors } from '@/constants/theme'
import type { Address } from '@owntown/types'

export default function AddressesScreen() {
  const qc = useQueryClient()

  const { data: addresses = [], isLoading } = useQuery<Address[]>({
    queryKey: ['addresses'],
    queryFn: () => api.get('/addresses').then(r => r.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/addresses/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['addresses'] }),
  })

  const defaultMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/addresses/${id}/default`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['addresses'] }),
  })

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Icon source="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Addresses</Text>
      </View>

      <FlatList
        data={addresses}
        keyExtractor={a => a.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          isLoading ? null : (
            <View style={styles.emptyState}>
              <Icon source="map-marker-off-outline" size={48} color={colors.textSecondary} />
              <Text style={styles.emptyText}>No addresses yet</Text>
            </View>
          )
        }
        renderItem={({ item: addr }) => (
          <View style={[styles.card, addr.isDefault && styles.defaultCard]}>
            <View style={styles.cardTop}>
              <View style={styles.cardInfo}>
                {addr.label && <Text style={styles.label}>{addr.label}</Text>}
                <Text style={styles.name}>{addr.name}</Text>
                <Text style={styles.addrLine} numberOfLines={2}>
                  {addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}
                  {addr.landmark ? `, Near ${addr.landmark}` : ''}
                </Text>
                <Text style={styles.addrLine}>{addr.city}, {addr.state} – {addr.pincode}</Text>
                <Text style={styles.phone}>{addr.phone}</Text>
              </View>
              {addr.isDefault && (
                <View style={styles.defaultBadge}>
                  <Text style={styles.defaultBadgeText}>Default</Text>
                </View>
              )}
            </View>
            <View style={styles.actions}>
              {!addr.isDefault && (
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => defaultMutation.mutate(addr.id)}
                >
                  <Text style={styles.actionText}>Set Default</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => router.push(`/addresses/edit/${addr.id}`)}
              >
                <Text style={styles.actionText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.deleteBtn]}
                onPress={() => deleteMutation.mutate(addr.id)}
              >
                <Text style={styles.deleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <View style={styles.footer}>
        <Button
          mode="contained"
          style={styles.addBtn}
          contentStyle={styles.addBtnContent}
          icon="plus"
          onPress={() => router.push('/addresses/new')}
        >
          Add New Address
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
  list: { padding: 16, gap: 12 },
  emptyState: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 15, color: colors.textSecondary },
  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    gap: 12, borderWidth: 1.5, borderColor: colors.border,
  },
  defaultCard: { borderColor: colors.primary },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardInfo: { flex: 1, gap: 2 },
  label: { fontSize: 11, fontWeight: '700', color: colors.primary, textTransform: 'uppercase', letterSpacing: 0.5 },
  name: { fontSize: 14, fontWeight: '700', color: colors.text },
  addrLine: { fontSize: 13, color: colors.textSecondary, lineHeight: 19 },
  phone: { fontSize: 13, color: colors.textSecondary },
  defaultBadge: {
    backgroundColor: colors.primaryLight, borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  defaultBadgeText: { fontSize: 11, color: colors.primary, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 8, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12 },
  actionBtn: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 6, borderWidth: 1, borderColor: colors.border,
  },
  actionText: { fontSize: 13, color: colors.text, fontWeight: '600' },
  deleteBtn: { borderColor: colors.error + '60' },
  deleteText: { fontSize: 13, color: colors.error, fontWeight: '600' },
  footer: { padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: colors.border },
  addBtn: { borderRadius: 12 },
  addBtnContent: { paddingVertical: 4 },
})
