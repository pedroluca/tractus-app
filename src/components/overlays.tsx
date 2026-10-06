import { Linking, Platform, View } from 'react-native'
import { Cake, ChevronLeft, ChevronRight, CloudDownload, Snowflake, TriangleAlert } from 'lucide-react-native'
import { useEffect, useMemo, useState } from 'react'
import { currentRelease, onboardingSteps } from '@/data/content'
import { getMinAppVersion, markAppVersionSeen, markOnboardingComplete, updateUserFields } from '@/data/profile'
import type { FreezeWarning } from '@/data/streak'
import { getLocalDateKey, isBirthdayToday } from '@/lib/dates'
import { env } from '@/lib/env'
import { subscribe } from '@/lib/events'
import { kv, storageKeys } from '@/lib/storage'
import { appVersion, compareVersions } from '@/lib/version'
import { useCurrentUser } from '@/providers/session-provider'
import { useThemeColors } from '@/theme/colors'
import { Button } from './ui/button'
import { Dialog } from './ui/dialog'
import { Sheet } from './ui/sheet'
import { Text } from './ui/text'

/**
 * Avisos globais do app (equivalente aos modais do app.tsx do web).
 * Prioridade: atualização obrigatória > onboarding > novidades > aniversário.
 * O aviso de freeze pode aparecer a qualquer momento.
 */
export function AppOverlays() {
  const profile = useCurrentUser()
  const [freezeWarning, setFreezeWarning] = useState<FreezeWarning | null>(null)
  const [requiredVersion, setRequiredVersion] = useState<string | null>(null)
  const [onboardingDone, setOnboardingDone] = useState(profile.hasCompletedOnboarding === true)
  const [releaseSeen, setReleaseSeen] = useState(false)
  const [birthdaySeen, setBirthdaySeen] = useState(false)

  useEffect(() => subscribe('freezeWarning', setFreezeWarning), [])

  useEffect(() => {
    getMinAppVersion()
      .then(min => {
        if (min && compareVersions(appVersion, min) < 0) setRequiredVersion(min)
      })
      .catch(() => {})
  }, [])

  if (profile.hasCompletedOnboarding === true && !onboardingDone) setOnboardingDone(true)

  const todayKey = getLocalDateKey()
  const showOnboarding = !requiredVersion && !onboardingDone
  const showRelease = !requiredVersion && onboardingDone && !releaseSeen
    && compareVersions(appVersion, currentRelease.version) >= 0
    && profile.lastSeenAppVersion !== currentRelease.version
  const isBirthday = !!profile.dataNascimento && isBirthdayToday(profile.dataNascimento)
  const showBirthday = !requiredVersion && onboardingDone && !showRelease && !birthdaySeen && isBirthday
    && profile.lastBirthdayCelebrationDate !== todayKey
    && kv.getString(storageKeys.birthdaySeen(profile.id, todayKey)) !== 'seen'

  return (
    <>
      <ForceUpdateDialog version={requiredVersion} />
      <OnboardingDialog
        visible={showOnboarding}
        isPremium={!!profile.isPremium}
        onDone={() => {
          setOnboardingDone(true)
          markOnboardingComplete(profile.id).catch(() => {})
        }}
      />
      <ReleaseNotesSheet
        visible={showRelease}
        onClose={() => {
          setReleaseSeen(true)
          markAppVersionSeen(profile.id, currentRelease.version).catch(() => {})
        }}
      />
      <BirthdayDialog
        visible={showBirthday}
        name={profile.nome.split(' ')[0]}
        onClose={() => {
          setBirthdaySeen(true)
          kv.set(storageKeys.birthdaySeen(profile.id, todayKey), 'seen')
          updateUserFields(profile.id, { lastBirthdayCelebrationDate: todayKey }).catch(() => {})
        }}
      />
      <FreezeWarningDialog warning={freezeWarning} onClose={() => setFreezeWarning(null)} />
    </>
  )
}

function FreezeWarningDialog({ warning, onClose }: { warning: FreezeWarning | null; onClose: () => void }) {
  const colors = useThemeColors()
  const Icon = warning?.streakBroken ? TriangleAlert : Snowflake
  return (
    <Dialog visible={!!warning} onClose={onClose}>
      {warning && (
        <View className="gap-4">
          <View className="w-12 h-12 rounded-2xl items-center justify-center" style={{ backgroundColor: `${colors.warning}1F` }}>
            <Icon size={24} color={colors.warning} />
          </View>
          <View className="gap-1.5">
            <Text variant="heading">{warning.streakBroken ? 'Sua streak foi zerada' : 'Você usou o último freeze'}</Text>
            <Text tone="muted" className="text-sm leading-5">{warning.message}</Text>
            <Text className="text-sm leading-5 font-medium mt-1">
              {warning.streakBroken ? 'Treine esta semana para começar uma nova sequência.' : 'Se passar mais uma semana sem treino, sua streak será zerada.'}
            </Text>
          </View>
          <Button label="Entendi" onPress={onClose} />
        </View>
      )}
    </Dialog>
  )
}

function OnboardingDialog({ visible, isPremium, onDone }: { visible: boolean; isPremium: boolean; onDone: () => void }) {
  const colors = useThemeColors()
  const steps = useMemo(() => onboardingSteps.filter(step => !step.premiumOnly || !isPremium), [isPremium])
  const [index, setIndex] = useState(0)
  const step = steps[index]
  const isLast = index === steps.length - 1

  return (
    <Dialog visible={visible}>
      <View className="gap-5">
        <View className="flex-row justify-end -mt-2 -mr-2">
          <Button label="Pular" variant="ghost" size="sm" onPress={onDone} />
        </View>
        <View className="items-center gap-3 min-h-52 justify-center">
          <View className="w-16 h-16 rounded-2xl bg-primary/10 items-center justify-center mb-1">
            <step.Icon size={30} color={colors.primary} />
          </View>
          <Text variant="title" className="text-center">{step.title}</Text>
          <Text tone="muted" className="text-center text-sm leading-5">{step.description}</Text>
        </View>
        <View className="flex-row justify-center gap-1.5">
          {steps.map((item, dotIndex) => (
            <View key={item.id} className={dotIndex === index ? 'h-1.5 w-5 rounded-full bg-primary' : 'h-1.5 w-1.5 rounded-full bg-surface-3'} />
          ))}
        </View>
        <View className="flex-row gap-2">
          {index > 0 && (
            <Button label="Voltar" icon={ChevronLeft} variant="secondary" onPress={() => setIndex(value => value - 1)} />
          )}
          <Button
            label={isLast ? 'Começar a treinar' : 'Próximo'}
            className="flex-1"
            onPress={() => (isLast ? onDone() : setIndex(value => value + 1))}
            icon={isLast ? undefined : ChevronRight}
          />
        </View>
      </View>
    </Dialog>
  )
}

function ReleaseNotesSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const colors = useThemeColors()
  return (
    <Sheet visible={visible} onClose={onClose} title={currentRelease.title} description={`Versão ${currentRelease.version}`} scrollable>
      <View className="gap-4 pb-2">
        {currentRelease.items.map(item => (
          <View key={item.id} className="flex-row gap-3.5">
            <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center">
              <item.Icon size={20} color={colors.primary} />
            </View>
            <View className="flex-1 gap-0.5">
              <Text className="text-base font-semibold">{item.title}</Text>
              <Text tone="muted" className="text-sm leading-5">{item.description}</Text>
            </View>
          </View>
        ))}
        <Button label="Entendi" onPress={onClose} className="mt-2" />
      </View>
    </Sheet>
  )
}

function BirthdayDialog({ visible, name, onClose }: { visible: boolean; name: string; onClose: () => void }) {
  const colors = useThemeColors()
  return (
    <Dialog visible={visible} onClose={onClose}>
      <View className="items-center gap-3">
        <View className="w-16 h-16 rounded-2xl items-center justify-center" style={{ backgroundColor: `${colors.premium}1F` }}>
          <Cake size={30} color={colors.premium} />
        </View>
        <Text variant="title" className="text-center">Feliz aniversário, {name}!</Text>
        <Text tone="muted" className="text-center text-sm leading-5">
          Que seu novo ano venha com mais saúde, evolução e boas conquistas dentro e fora do treino.
        </Text>
        <Button label="Obrigado!" onPress={onClose} className="self-stretch mt-2" />
      </View>
    </Dialog>
  )
}

function ForceUpdateDialog({ version }: { version: string | null }) {
  const colors = useThemeColors()
  const openStore = () => {
    const marketUrl = 'market://details?id=com.trainlog.app'
    Linking.openURL(Platform.OS === 'android' ? marketUrl : env.playStoreUrl).catch(() => Linking.openURL(env.playStoreUrl))
  }
  return (
    <Dialog visible={!!version}>
      <View className="gap-4">
        <View className="w-12 h-12 rounded-2xl bg-primary/10 items-center justify-center">
          <CloudDownload size={24} color={colors.primary} />
        </View>
        <View className="gap-1.5">
          <Text variant="heading">Atualização necessária</Text>
          <Text tone="muted" className="text-sm leading-5">
            A versão {version} do Tractus já está disponível e é necessária para continuar usando o app.
          </Text>
        </View>
        <Button label="Atualizar na Play Store" onPress={openStore} />
      </View>
    </Dialog>
  )
}
