import { router, useFocusEffect } from 'expo-router'
import { Check, ChevronRight, ClipboardList, Search, Send, UserMinus, X } from 'lucide-react-native'
import { useCallback, useState } from 'react'
import { View } from 'react-native'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { IconButton } from '@/components/ui/icon-button'
import { Callout, EmptyState, LoadingState } from '@/components/ui/misc'
import { ScreenScroll, SectionTitle, TabHeader } from '@/components/ui/screen'
import { Text } from '@/components/ui/text'
import { TextField } from '@/components/ui/text-field'
import { UserRow } from '@/components/user-row'
import {
  acceptCoachingRequest,
  CoachingRequestError,
  findUserForCoaching,
  getCoachingData,
  removeCoachingRelation,
  sendCoachingRequest,
  type CoachingData,
} from '@/data/trainer'
import type { UserProfile } from '@/data/types'
import { haptics } from '@/lib/haptics'
import { useCurrentUser } from '@/providers/session-provider'
import { useConfirm } from '@/providers/confirm-provider'
import { useToast } from '@/providers/toast-provider'
import { useThemeColors } from '@/theme/colors'

export default function CoachingScreen() {
  const profile = useCurrentUser()
  const colors = useThemeColors()
  const toast = useToast()
  const confirm = useConfirm()
  const isTrainer = !!profile.isTrainer

  const [data, setData] = useState<CoachingData | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [searching, setSearching] = useState(false)
  const [result, setResult] = useState<UserProfile | null>(null)
  const [actionId, setActionId] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setData(await getCoachingData(profile.id))
    } catch {
      toast.error('Não foi possível carregar seus vínculos.')
      setData(current => current ?? { relations: [], pendingReceived: [], outgoingPending: [], students: [], trainers: [] })
    }
  }, [profile.id, toast])

  useFocusEffect(useCallback(() => {
    load()
  }, [load]))

  const handleSearch = async () => {
    const term = search.trim()
    if (!term) return
    setSearching(true)
    setResult(null)
    try {
      const found = await findUserForCoaching(term)
      if (!found) toast.show('Nenhum usuário com esse username ou email exato.')
      else if (found.id === profile.id) toast.error('Você não pode criar um vínculo com você mesmo.')
      else setResult(found)
    } catch {
      toast.error('Erro ao buscar usuário.')
    } finally {
      setSearching(false)
    }
  }

  const handleSend = async () => {
    if (!result || !data) return
    setActionId('send')
    try {
      await sendCoachingRequest(profile, result, data.relations)
      haptics.success()
      toast.success('Solicitação enviada!')
      setResult(null)
      setSearch('')
      await load()
    } catch (error) {
      toast.error(error instanceof CoachingRequestError ? error.message : 'Erro ao enviar a solicitação.')
    } finally {
      setActionId(null)
    }
  }

  const respond = async (relationId: string, accept: boolean) => {
    setActionId(relationId)
    try {
      if (accept) await acceptCoachingRequest(relationId)
      else await removeCoachingRelation(relationId)
      toast.success(accept ? 'Vínculo aceito!' : 'Solicitação recusada.')
      await load()
    } catch {
      toast.error('Não foi possível responder a solicitação.')
    } finally {
      setActionId(null)
    }
  }

  const confirmUnlink = (user: UserProfile, relationId: string) => {
    confirm({
      title: 'Desfazer vínculo',
      message: `Remover o vínculo com ${user.nome}? Os treinos já criados continuam com o aluno.`,
      confirmLabel: 'Remover',
      icon: UserMinus,
      onConfirm: () => respond(relationId, false),
    })
  }

  const relationIdWith = (otherId: string) =>
    data?.relations.find(relation => relation.status === 'accepted' && (relation.trainerId === otherId || relation.studentId === otherId))?.id

  return (
    <ScreenScroll
      header={<TabHeader title={isTrainer ? 'Alunos' : 'Treinador'} subtitle={isTrainer ? 'Perfil de treinador' : 'Perfil de aluno'} />}
      refreshing={refreshing}
      onRefresh={async () => {
        setRefreshing(true)
        await load()
        setRefreshing(false)
      }}
    >
      <Card className="p-4 gap-3">
        <View className="gap-1">
          <Text variant="subheading">{isTrainer ? 'Convidar aluno' : 'Encontrar treinador'}</Text>
          <Text tone="muted" className="text-sm leading-5">
            {isTrainer
              ? 'Busque pelo username ou email exato do aluno. Depois que ele aceitar, você poderá montar os treinos dele.'
              : 'Busque pelo username ou email exato do seu personal. Ele poderá montar treinos para você.'}
          </Text>
        </View>
        <View className="flex-row gap-2 items-end">
          <TextField
            containerClassName="flex-1"
            value={search}
            onChangeText={setSearch}
            placeholder="@username ou email"
            autoCapitalize="none"
            keyboardType="email-address"
            returnKeyType="search"
            onSubmitEditing={handleSearch}
          />
          <IconButton icon={Search} variant="primary" size={48} accessibilityLabel="Buscar" onPress={handleSearch} disabled={searching} />
        </View>
        {result && (
          <View className="bg-surface-2 rounded-2xl overflow-hidden">
            <UserRow
              user={result}
              right={<Button label="Enviar" icon={Send} size="sm" loading={actionId === 'send'} onPress={handleSend} />}
            />
          </View>
        )}
      </Card>

      {data === null ? (
        <LoadingState />
      ) : (
        <>
          {data.pendingReceived.length > 0 && (
            <View className="gap-2">
              <SectionTitle title="Solicitações recebidas" />
              <Card className="overflow-hidden">
                {data.pendingReceived.map(({ relation, requester }, index) => (
                  <View key={relation.id}>
                    {index > 0 && <View className="h-px bg-border ml-[72px]" />}
                    <UserRow
                      user={requester}
                      subtitle={relation.requestedByRole === 'trainer' ? 'Quer ser seu treinador' : 'Quer ser seu aluno'}
                      right={(
                        <View className="flex-row gap-2">
                          <IconButton icon={X} variant="surface" accessibilityLabel="Recusar" disabled={actionId === relation.id} onPress={() => respond(relation.id, false)} />
                          <IconButton icon={Check} variant="primary" accessibilityLabel="Aceitar" disabled={actionId === relation.id} onPress={() => respond(relation.id, true)} />
                        </View>
                      )}
                    />
                  </View>
                ))}
              </Card>
            </View>
          )}

          {data.outgoingPending.length > 0 && (
            <Callout tone="info" title="Aguardando resposta">
              {`${data.outgoingPending.length} ${data.outgoingPending.length === 1 ? 'solicitação enviada ainda não foi respondida' : 'solicitações enviadas ainda não foram respondidas'}.`}
            </Callout>
          )}

          {isTrainer && (
            <View className="gap-2">
              <SectionTitle title="Meus alunos" />
              {data.students.length === 0 ? (
                <Card>
                  <EmptyState icon={ClipboardList} title="Nenhum aluno vinculado" description="Convide seus alunos pela busca acima." />
                </Card>
              ) : (
                <Card className="overflow-hidden">
                  {data.students.map((student, index) => (
                    <View key={student.id}>
                      {index > 0 && <View className="h-px bg-border ml-[72px]" />}
                      <UserRow
                        user={student}
                        subtitle="Toque para montar os treinos"
                        onPress={() => router.push({ pathname: '/student/[studentId]', params: { studentId: student.id } })}
                        right={<ChevronRight size={18} color={colors.subtle} />}
                      />
                    </View>
                  ))}
                </Card>
              )}
            </View>
          )}

          <View className="gap-2">
            <SectionTitle title="Meus treinadores" />
            {data.trainers.length === 0 ? (
              <Card>
                <EmptyState
                  icon={ClipboardList}
                  title="Nenhum treinador vinculado"
                  description="Quando um treinador montar um treino para você, ele aparece na aba Treino."
                />
              </Card>
            ) : (
              <Card className="overflow-hidden">
                {data.trainers.map((trainer, index) => {
                  const relationId = relationIdWith(trainer.id)
                  return (
                    <View key={trainer.id}>
                      {index > 0 && <View className="h-px bg-border ml-[72px]" />}
                      <UserRow
                        user={trainer}
                        subtitle={trainer.cref ? `CREF ${trainer.cref}` : undefined}
                        onPress={() => router.push({ pathname: '/friend/[id]', params: { id: trainer.id } })}
                        right={relationId ? (
                          <IconButton icon={UserMinus} accessibilityLabel="Desfazer vínculo" onPress={() => confirmUnlink(trainer, relationId)} />
                        ) : undefined}
                      />
                    </View>
                  )
                })}
              </Card>
            )}
          </View>
        </>
      )}
    </ScreenScroll>
  )
}
