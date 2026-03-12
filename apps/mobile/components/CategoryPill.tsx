import { TouchableOpacity, Image, StyleSheet, View } from 'react-native'
import { Text } from 'react-native-paper'
import { colors } from '@/constants/theme'
import type { Category } from '@owntown/types'

interface Props {
  category: Category
  selected?: boolean
  onPress: () => void
}

export function CategoryPill({ category, selected, onPress }: Props) {
  return (
    <TouchableOpacity
      style={[styles.pill, selected && styles.pillSelected]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {category.imageUrl ? (
        <Image source={{ uri: category.imageUrl }} style={styles.icon} />
      ) : (
        <View style={[styles.iconPlaceholder, selected && styles.iconPlaceholderSelected]} />
      )}
      <Text style={[styles.label, selected && styles.labelSelected]} numberOfLines={1}>
        {category.name}
      </Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  pill: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    gap: 6,
    width: 76,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  pillSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  icon: { width: 36, height: 36, borderRadius: 8 },
  iconPlaceholder: { width: 36, height: 36, borderRadius: 8, backgroundColor: colors.background },
  iconPlaceholderSelected: { backgroundColor: colors.primary + '20' },
  label: { fontSize: 11, color: colors.text, textAlign: 'center', fontWeight: '500' },
  labelSelected: { color: colors.primary, fontWeight: '700' },
})
