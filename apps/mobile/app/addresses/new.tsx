import { useState } from 'react'
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native'
import { Text, TextInput, Button, Icon, ActivityIndicator } from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { colors } from '@/constants/theme'

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
}

export default function NewAddressScreen() {
  const qc = useQueryClient()
  const [form, setForm] = useState<FormState>({
    label: '', name: '', phone: '', line1: '', line2: '',
    landmark: '', city: '', state: '', pincode: '',
  })
  const [errors, setErrors] = useState<Partial<FormState>>({})

  const set = (key: keyof FormState) => (val: string) =>
    setForm(f => ({ ...f, [key]: val }))

  const validate = () => {
    const e: Partial<FormState> = {}
    if (!form.name.trim()) e.name = 'Required'
    if (!/^\d{10}$/.test(form.phone)) e.phone = 'Enter valid 10-digit mobile'
    if (!form.line1.trim()) e.line1 = 'Required'
    if (!form.city.trim()) e.city = 'Required'
    if (!form.state.trim()) e.state = 'Required'
    if (!/^\d{6}$/.test(form.pincode)) e.pincode = 'Enter valid 6-digit pincode'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const { data: serviceability, isFetching: svcLoading } = useQuery({
    queryKey: ['serviceability', form.pincode],
    queryFn: () =>
      api.get(`/shipping/serviceability?pincode=${form.pincode}`).then(r => r.data),
    enabled: /^\d{6}$/.test(form.pincode),
    staleTime: 5 * 60 * 1000,
  })

  const mutation = useMutation({
    mutationFn: () => api.post('/addresses', {
      ...form,
      label: form.label || undefined,
      line2: form.line2 || undefined,
      landmark: form.landmark || undefined,
    }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['addresses'] })
      router.back()
    },
  })

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Icon source="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Address</Text>
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
        <View>
          <Field
            label="Pincode *"
            value={form.pincode}
            onChangeText={set('pincode')}
            error={errors.pincode}
            keyboardType="numeric"
            maxLength={6}
          />
          {/^\d{6}$/.test(form.pincode) && (
            <View style={styles.svcRow}>
              {svcLoading ? (
                <>
                  <ActivityIndicator size={12} color={colors.primary} />
                  <Text style={styles.svcChecking}>Checking delivery availability…</Text>
                </>
              ) : serviceability ? (
                <>
                  <Icon
                    source={serviceability.isServiceable ? 'check-circle' : 'close-circle'}
                    size={14}
                    color={serviceability.isServiceable ? colors.success : colors.error}
                  />
                  <Text style={[styles.svcText, { color: serviceability.isServiceable ? colors.success : colors.error }]}>
                    {serviceability.isServiceable
                      ? `We deliver here${serviceability.estimatedDays ? ` · ~${serviceability.estimatedDays} day${serviceability.estimatedDays > 1 ? 's' : ''}` : ''}`
                      : 'Sorry, we don\'t deliver to this pincode yet'}
                  </Text>
                </>
              ) : null}
            </View>
          )}
        </View>

        {mutation.isError && (
          <Text style={styles.serverError}>Failed to save address. Please try again.</Text>
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
          Save Address
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
  serverError: { color: colors.error, fontSize: 13, textAlign: 'center' },
  footer: { padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: colors.border },
  saveBtn: { borderRadius: 12 },
  saveBtnContent: { paddingVertical: 6 },
  svcRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4, marginLeft: 4 },
  svcChecking: { fontSize: 11, color: colors.textSecondary },
  svcText: { fontSize: 11, fontWeight: '600' },
})
