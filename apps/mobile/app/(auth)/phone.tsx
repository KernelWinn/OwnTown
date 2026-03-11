import { useState } from 'react'
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native'
import { Text, TextInput, Button, HelperText } from 'react-native-paper'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { isValidIndianPhone, normalizePhone } from '@owntown/utils'
import { useAuthStore } from '@/store/auth'
import { colors } from '@/constants/theme'

export default function PhoneScreen() {
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const { sendOtp, isLoading } = useAuthStore()

  async function handleContinue() {
    const normalized = normalizePhone(phone)
    if (!isValidIndianPhone(normalized)) {
      setError('Enter a valid 10-digit mobile number')
      return
    }
    setError('')
    const success = await sendOtp(normalized)
    if (success) {
      router.push({ pathname: '/(auth)/otp', params: { phone: normalized } })
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inner}
      >
        <View style={styles.content}>
          <Text variant="headlineMedium" style={styles.title}>Enter your mobile number</Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            We'll send a one-time password to verify your number
          </Text>
          <View style={styles.inputRow}>
            <View style={styles.prefix}>
              <Text variant="bodyLarge" style={styles.prefixText}>+91</Text>
            </View>
            <TextInput
              mode="outlined"
              label="Mobile number"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              maxLength={10}
              style={styles.input}
              outlineColor={colors.border}
              activeOutlineColor={colors.primary}
              autoFocus
            />
          </View>
          {error ? <HelperText type="error">{error}</HelperText> : null}
          <Button
            mode="contained"
            onPress={handleContinue}
            loading={isLoading}
            disabled={isLoading || phone.length < 10}
            style={styles.button}
            contentStyle={styles.buttonContent}
          >
            Send OTP
          </Button>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  inner: { flex: 1 },
  content: { flex: 1, padding: 24, gap: 16, justifyContent: 'center' },
  title: { fontWeight: 'bold', color: colors.text },
  subtitle: { color: colors.textSecondary },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  prefix: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 14,
    justifyContent: 'center',
  },
  prefixText: { fontWeight: '600', color: colors.text },
  input: { flex: 1, backgroundColor: '#fff' },
  button: { marginTop: 8, borderRadius: 12 },
  buttonContent: { paddingVertical: 6 },
})
