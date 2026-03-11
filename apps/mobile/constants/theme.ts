import { MD3LightTheme } from 'react-native-paper'
import type { OrderStatus } from '@owntown/types'

export const colors = {
  primary: '#7C3AED',       // Violet — brand color
  primaryLight: '#EDE9FE',
  secondary: '#F59E0B',     // Amber — accent
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  text: '#111827',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  background: '#F9FAFB',
  surface: '#FFFFFF',
}

export const statusColors: Partial<Record<OrderStatus, string>> = {
  pending: '#6B7280',
  confirmed: '#3B82F6',
  packed: '#8B5CF6',
  shipped: '#F59E0B',
  out_for_delivery: '#F97316',
  delivered: '#10B981',
  cancelled: '#EF4444',
  payment_failed: '#EF4444',
  returned: '#6B7280',
}

export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    secondary: colors.secondary,
    error: colors.error,
    background: colors.background,
    surface: colors.surface,
  },
}
