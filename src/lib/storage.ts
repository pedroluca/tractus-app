import { createMMKV } from 'react-native-mmkv'

// Armazenamento local síncrono (equivalente ao localStorage do web)
const storage = createMMKV({ id: 'tractus' })

export const kv = {
  getString: (key: string) => storage.getString(key),
  getBoolean: (key: string) => storage.getBoolean(key),
  set: (key: string, value: string | boolean | number) => storage.set(key, value),
  remove: (key: string) => storage.remove(key),
  clearAll: () => storage.clearAll(),
}

export const storageKeys = {
  themeMode: 'themeMode',
  primaryColor: 'primaryColor',
  workoutCelebrated: (workoutId: string, dateKey: string) => `workout-completed:${workoutId}:${dateKey}`,
  birthdaySeen: (userId: string, dateKey: string) => `birthday:${userId}:${dateKey}`,
  lastMaintenanceDate: (userId: string) => `maintenance:${userId}`,
}
