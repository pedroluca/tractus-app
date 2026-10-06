import { getAnalytics } from '@react-native-firebase/analytics'
import { getAuth } from '@react-native-firebase/auth'
import { getCrashlytics } from '@react-native-firebase/crashlytics'
import { getFirestore } from '@react-native-firebase/firestore'

// No SDK nativo a configuração vem do google-services.json e o cache offline do
// Firestore já fica ligado por padrão (persistido em disco, sobrevive ao fechar o app).
export const auth = getAuth()
export const db = getFirestore()
export const analytics = getAnalytics()
export const crashlytics = getCrashlytics()
