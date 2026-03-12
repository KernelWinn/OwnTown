import { useRef } from 'react'
import { View, StyleSheet } from 'react-native'
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete'
import { colors } from '@/constants/theme'

const PLACES_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_KEY ?? ''

export interface PlaceFields {
  line1: string
  city: string
  state: string
  pincode: string
}

interface Props {
  onSelect: (fields: PlaceFields) => void
}

export function PlacesAutocomplete({ onSelect }: Props) {
  const ref = useRef<any>(null)

  return (
    <View style={styles.container}>
      <GooglePlacesAutocomplete
        ref={ref}
        placeholder="Search location to auto-fill address…"
        fetchDetails
        onPress={(_data, details) => {
          if (!details) return
          const components = details.address_components ?? []

          const get = (...types: string[]) =>
            components.find(c => types.some(t => c.types.includes(t)))?.long_name ?? ''

          const streetNumber = get('street_number')
          const route = get('route')
          const sublocality = get('sublocality_level_1', 'sublocality', 'neighborhood')
          const city =
            get('locality') ||
            get('administrative_area_level_2') ||
            get('administrative_area_level_3')
          const state = get('administrative_area_level_1')
          const pincode = get('postal_code')

          const line1Parts = [streetNumber, route, sublocality].filter(Boolean)
          const line1 = line1Parts.length ? line1Parts.join(', ') : details.name ?? ''

          onSelect({ line1, city, state, pincode })
          ref.current?.clear()
        }}
        query={{
          key: PLACES_KEY,
          language: 'en',
          components: 'country:in',
          types: 'address',
        }}
        requestUrl={{
          useOnPlatform: 'all',
          url: 'https://maps.googleapis.com/maps/api',
        }}
        styles={{
          container: styles.autocompleteContainer,
          textInput: styles.input,
          listView: styles.listView,
          row: styles.row,
          description: styles.description,
          separator: styles.separator,
          poweredContainer: styles.poweredContainer,
        }}
        textInputProps={{
          placeholderTextColor: colors.textSecondary,
        }}
        enablePoweredByContainer={false}
        minLength={3}
        debounce={300}
        keyboardShouldPersistTaps="handled"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { zIndex: 10 },
  autocompleteContainer: { backgroundColor: 'transparent' },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    color: colors.text,
    backgroundColor: '#fff',
  },
  listView: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: '#fff',
    marginTop: 4,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  row: { paddingVertical: 12, paddingHorizontal: 14 },
  description: { fontSize: 13, color: colors.text },
  separator: { height: 1, backgroundColor: colors.border },
  poweredContainer: { display: 'none' },
})
