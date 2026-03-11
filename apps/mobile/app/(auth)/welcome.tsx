import { View, StyleSheet, Image } from 'react-native'
import { Text, Button } from 'react-native-paper'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors } from '@/constants/theme'

export default function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.hero}>
          {/* Logo placeholder */}
          <View style={styles.logoPlaceholder}>
            <Text variant="displaySmall" style={styles.logoText}>OwnTown</Text>
          </View>
          <Text variant="headlineMedium" style={styles.headline}>
            Groceries delivered to your door
          </Text>
          <Text variant="bodyLarge" style={styles.subtext}>
            Fresh produce, pantry essentials, and more — delivered on your schedule.
          </Text>
        </View>
        <View style={styles.actions}>
          <Button
            mode="contained"
            onPress={() => router.push('/(auth)/phone')}
            style={styles.button}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
          >
            Get Started
          </Button>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary },
  content: { flex: 1, justifyContent: 'space-between', padding: 24 },
  hero: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  logoPlaceholder: { marginBottom: 16 },
  logoText: { color: '#fff', fontWeight: 'bold' },
  headline: { color: '#fff', textAlign: 'center', fontWeight: 'bold' },
  subtext: { color: 'rgba(255,255,255,0.85)', textAlign: 'center' },
  actions: { paddingBottom: 16 },
  button: { backgroundColor: '#fff', borderRadius: 12 },
  buttonContent: { paddingVertical: 6 },
  buttonLabel: { color: colors.primary, fontSize: 16, fontWeight: 'bold' },
})
