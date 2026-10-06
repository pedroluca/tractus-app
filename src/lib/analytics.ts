import { logEvent, logLogin, logScreenView, logSignUp, setUserId } from '@react-native-firebase/analytics'
import { analytics } from './firebase'

// Analytics nunca pode derrubar um fluxo do usuário: todos os erros são engolidos
const track = (result: unknown) => {
  if (result instanceof Promise) {
    result.catch(error => {
      if (__DEV__) console.warn('[analytics]', error)
    })
  }
}

const event = (name: string, params?: Record<string, string | number | boolean>) =>
  track(logEvent(analytics, name, params))

export const trackScreen = (screenName: string) =>
  track(logScreenView(analytics, { screen_name: screenName, screen_class: screenName }))

export const identifyUser = (userId: string | null) => track(setUserId(analytics, userId))

export const trackLogin = () => track(logLogin(analytics, { method: 'email' }))
export const trackSignUp = () => track(logSignUp(analytics, { method: 'email' }))
export const trackLogout = () => event('logout')

export const trackWorkoutCreated = (day: string) => event('workout_created', { day })
export const trackWorkoutCompleted = (day: string, exerciseCount: number) =>
  event('workout_completed', { day, exercise_count: exerciseCount })
export const trackWorkoutShared = () => event('workout_shared')
export const trackTemplateCloned = (templateName: string) => event('template_cloned', { template_name: templateName })

export const trackExerciseAdded = (exercise: string) => event('exercise_added', { exercise })
export const trackExerciseCompleted = (exercise: string) => event('exercise_completed', { exercise })

export const trackProfilePhotoUpdated = () => event('profile_photo_updated')
export const trackMetricsUpdated = (weight: number, height: number) =>
  event('metrics_updated', { weight_kg: weight, height_cm: height })

export const trackPremiumUpgradeModalOpened = () => event('premium_upgrade_modal_opened')
export const trackPremiumUpgradeRequested = () => event('premium_upgrade_requested')
export const trackStreakCalendarViewed = () => event('streak_calendar_viewed')
export const trackDarkModeToggled = (enabled: boolean) => event('dark_mode_toggled', { enabled: enabled ? 1 : 0 })
