import { useEffect, useState } from 'react'
import { View, ScrollView, StyleSheet, TouchableOpacity, Switch } from 'react-native'
import { Text, TextInput, Button, Icon, ActivityIndicator } from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { colors } from '@/constants/theme'
import type { Address } from '@owntown/types'

interface FormState {
  label: string
  name: string
  phone: string
  line1: string
  line2: string
  landmark: string
  city: string
  state: string
  pincode: string
  isDefault: boolean
}

export default function EditAddressScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const qc = useQueryClient()

  const [form, setForm] = useState<FormState>({
    label: '', name: '', phone: '', line1: '', line2: '',
    landmark: '', city: '', state: '', pincode: '', isDefault: false,
  })
  const [errors, setErrors] = useState<Partial<Omit<FormState, 'isDefault'>>>({})

  const { data: address, isLoading } = useQuery<Address>({
    queryKey: ['address', id],
    queryFn: () => api.get(`/addresses/${id}`).then(r => r.data),
    enabled: !!id,
  })

  // Pre-fill form once address is loaded
  useEffect(() => {
    if (address) {
      setForm({
        label: address.label ?? '',
        name: address.name,
        phone: address.phone,
        line1: address.line1,
        line2: address.line2 ?? '',
        landmark: address.landmark ?? '',
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        isDefault: address.isDefault,
      })
    }
  }, [address])

  const set = (key: keyof FormState) => (val: string) =>
    setForm(f => ({ ...f, [key]: val }))

  const validate = () => {
    const e: Partial<Omit<FormState, 'isDefault'>> = {}
    if (!form.name.trim()) e.name = 'Required'
    if (!/^\d{10}$/.test(form.phone)) e.phone = 'Enter valid 10-digit mobile'
    if (!form.line1.trim()) e.line1 = 'Required'
    if (!form.city.trim()) e.city = 'Required'
    if (!form.state.trim()) e.state = 'Required'
    if (!/^\d{6}$/.test(form.pincode)) e.pincode = 'Enter valid 6-digit pincode'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const mutation = useMutation({
    mutationFn: () =>
      api.put(`/addresses/${id}`, {
        label: form.label || undefined,
        name: form.name,
        phone: form.phone,
        line1: form.line1,
        line2: form.line2 || undefined,
        landmark: form.landmark || undefined,
        city: form.city,
        state: form.state,
        pincode: form.pincode,
        isDefault: form.isDefault,
      }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['addresses'] })
      qc.invalidateQueries({ queryKey: ['address', id] })
      router.back()
    },
  })

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Icon source="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Address</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Field
          label="Label (optional)"
          placeholder="Home, Office…"
          value={form.label}
          onChangeText={set('label')}
        />
        <Field
          label="Full Name *"
          value={form.name}
          onChangeText={set('name')}
          error={errors.name}
          autoCapitalize="words"
        />
        <Field
          label="Mobile Number *"
          value={form.phone}
          onChangeText={set('phone')}
          error={errors.phone}
          keyboardType="phone-pad"
          maxLength={10}
        />
        <Field
          label="Address Line 1 *"
          placeholder="Flat / House no., Building name"
          value={form.line1}
          onChangeText={set('line1')}
          error={errors.line1}
        />
        <Field
          label="Address Line 2"
          placeholder="Street, Area (optional)"
          value={form.line2}
          onChangeText={set('line2')}
        />
        <Field
          label="Landmark"
          placeholder="Near… (optional)"
          value={form.landmark}
          onChangeText={set('landmark')}
        />
        <View style={styles.row}>
          <View style={styles.flex1}>
            <Field
              label="City *"
              value={form.city}
              onChangeText={set('city')}
              error={errors.city}
              autoCapitalize="words"
            />
          </View>
          <View style={styles.flex1}>
            <Field
              label="State *"
              value={form.state}
              onChangeText={set('state')}
              error={errors.state}
              autoCapitalize="words"
            />
          </View>
        </View>
        <Field
          label="Pincode *"
          value={form.pincode}
          onChangeText={set('pincode')}
          error={errors.pincode}
          keyboardType="numeric"
          maxLength={6}
        />

        {/* Set as default toggle */}
        <View style={styles.defaultRow}>
          <View style={styles.defaultInfo}>
            <Text style={styles.defaultLabel}>Set as default address</Text>
            <Text style={styles.defaultSub}>Used automatically at checkout</Text>
          </View>
          <Switch
            value={form.isDefault}
            onValueChange={v => setForm(f => ({ ...f, isDefault: v }))}
            trackColor={{ false: colors.border, true: colors.primary + '80' }}
            thumbColor={form.isDefault ? colors.primary : '#f4f3f4'}
          />
        </View>

        {mutation.isError && (
          <Text style={styles.serverError}>Failed to update address. Please try again.</Text>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          mode="contained"
          onPress={() => validate() && mutation.mutate()}
          loading={mutation.isPending}
          disabled={mutation.isPending}
          style={styles.saveBtn}
          contentStyle={styles.saveBtnContent}
        >
          Save Changes
        </Button>
      </View>
    </SafeAreaView>
  )
}

function Field({
  label, placeholder, value, onChangeText, error,
  keyboardType, maxLength, autoCapitalize,
}: {
  label: string
  placeholder?: string
  value: string
  onChangeText: (v: string) => void
  error?: string
  keyboardType?: any
  maxLength?: number
  autoCapitalize?: any
}) {
  return (
    <View style={fieldStyles.wrap}>
      <TextInput
        label={label}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        mode="outlined"
        error={!!error}
        keyboardType={keyboardType}
        maxLength={maxLength}
        autoCapitalize={autoCapitalize ?? 'none'}
        style={fieldStyles.input}
        outlineStyle={fieldStyles.outline}
      />
      {error && <Text style={fieldStyles.error}>{error}</Text>}
    </View>
  )
}

const fieldStyles = StyleSheet.create({
  wrap: { gap: 2 },
  input: { backgroundColor: '#fff', fontSize: 14 },
  outline: { borderRadius: 10 },
  error: { fontSize: 11, color: colors.error, marginLeft: 4 },
})

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
  scroll: { padding: 16, gap: 12, paddingBottom: 8 },
  row: { flexDirection: 'row', gap: 10 },
  flex1: { flex: 1 },
  defaultRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: colors.border,
  },
  defaultInfo: { flex: 1, gap: 2 },
  defaultLabel: { fontSize: 14, fontWeight: '600', color: colors.text },
  defaultSub: { fontSize: 12, color: colors.textSecondary },
  serverError: { color: colors.error, fontSize: 13, textAlign: 'center' },
  footer: { padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: colors.border },
  saveBtn: { borderRadius: 12 },
  saveBtnContent: { paddingVertical: 6 },
})
