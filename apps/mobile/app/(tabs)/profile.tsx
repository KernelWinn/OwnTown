import { View, StyleSheet } from 'react-native'
import { Text, Button, List } from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useAuthStore } from '@/store/auth'
import { colors } from '@/constants/theme'

export default function ProfileScreen() {
  const { user, logout } = useAuthStore()

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text variant="headlineMedium" style={styles.avatarText}>
            {user?.name?.[0]?.toUpperCase() ?? user?.phone?.[0]}
          </Text>
        </View>
        <Text variant="titleLarge" style={styles.name}>{user?.name ?? 'Guest'}</Text>
        <Text variant="bodyMedium" style={styles.phone}>+91 {user?.phone}</Text>
      </View>

      <List.Section>
        <List.Item
          title="My Addresses"
          left={props => <List.Icon {...props} icon="map-marker-outline" />}
          onPress={() => router.push('/addresses')}
        />
        <List.Item
          title="Order History"
          left={props => <List.Icon {...props} icon="package-variant-closed" />}
          onPress={() => router.push('/(tabs)/orders')}
        />
        <List.Item
          title="Help & Support"
          left={props => <List.Icon {...props} icon="help-circle-outline" />}
          onPress={() => {}}
        />
      </List.Section>

      <View style={styles.logoutContainer}>
        <Button
          mode="outlined"
          onPress={logout}
          textColor={colors.error}
          style={styles.logoutButton}
        >
          Logout
        </Button>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f8' },
  header: { backgroundColor: '#fff', alignItems: 'center', padding: 24, gap: 8 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#fff', fontWeight: 'bold' },
  name: { fontWeight: 'bold', color: colors.text },
  phone: { color: colors.textSecondary },
  logoutContainer: { padding: 24 },
  logoutButton: { borderColor: colors.error },
})
