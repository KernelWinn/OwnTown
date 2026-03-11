import { useState, useEffect, useRef } from 'react'
import { View, StyleSheet, TextInput as RNTextInput } from 'react-native'
import { Text, Button } from 'react-native-paper'
import { router, useLocalSearchParams } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuthStore } from '@/store/auth'
import { colors } from '@/constants/theme'

const OTP_LENGTH = 6

export default function OtpScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>()
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(30)
  const { verifyOtp, sendOtp, isLoading } = useAuthStore()
  const inputRef = useRef<RNTextInput>(null)

  useEffect(() => {
    if (countdown <= 0) return
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown])

  async function handleVerify() {
    if (otp.length !== OTP_LENGTH) return
    setError('')
    const result = await verifyOtp(phone!, otp)
    if (result.success) {
      router.replace(result.isNewUser ? '/(auth)/profile-setup' : '/(tabs)')
    } else {
      setError('Invalid OTP. Please try again.')
      setOtp('')
    }
  }

  async function handleResend() {
    setOtp('')
    setError('')
    await sendOtp(phone!)
    setCountdown(30)
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text variant="headlineMedium" style={styles.title}>Enter OTP</Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Sent to +91 {phone}
        </Text>

        {/* Single hidden input driving OTP display */}
        <View style={styles.otpContainer}>
          {Array.from({ length: OTP_LENGTH }).map((_, i) => (
            <View
              key={i}
              style={[styles.otpBox, otp.length === i && styles.otpBoxActive]}
            >
              <Text variant="headlineSmall" style={styles.otpChar}>
                {otp[i] ?? ''}
              </Text>
            </View>
          ))}
          <RNTextInput
            ref={inputRef}
            value={otp}
            onChangeText={v => {
              if (/^\d*$/.test(v) && v.length <= OTP_LENGTH) setOtp(v)
            }}
            keyboardType="number-pad"
            maxLength={OTP_LENGTH}
            style={styles.hiddenInput}
            autoFocus
          />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button
          mode="contained"
          onPress={handleVerify}
          loading={isLoading}
          disabled={isLoading || otp.length !== OTP_LENGTH}
          style={styles.button}
          contentStyle={styles.buttonContent}
        >
          Verify
        </Button>

        <View style={styles.resendRow}>
          {countdown > 0 ? (
            <Text variant="bodyMedium" style={styles.countdown}>
              Resend OTP in {countdown}s
            </Text>
          ) : (
            <Button mode="text" onPress={handleResend} textColor={colors.primary}>
              Resend OTP
            </Button>
          )}
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1, padding: 24, gap: 24, justifyContent: 'center' },
  title: { fontWeight: 'bold', color: colors.text },
  subtitle: { color: colors.textSecondary },
  otpContainer: { flexDirection: 'row', gap: 10, justifyContent: 'center', position: 'relative' },
  otpBox: {
    width: 48,
    height: 56,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpBoxActive: { borderColor: colors.primary },
  otpChar: { fontWeight: 'bold', color: colors.text },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: '100%',
    height: '100%',
  },
  error: { color: colors.error, textAlign: 'center' },
  button: { borderRadius: 12 },
  buttonContent: { paddingVertical: 6 },
  resendRow: { alignItems: 'center' },
  countdown: { color: colors.textSecondary },
})
