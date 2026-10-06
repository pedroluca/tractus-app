import { History } from 'lucide-react-native'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ActivityIndicator, RefreshControl, SectionList, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { EmptyState, LoadingState } from '@/components/ui/misc'
import { Text } from '@/components/ui/text'
import { describeLog, getLogsPage, getUserLogsCount, groupLogsByDay, type LogsPage } from '@/data/logs'
import type { LogEntry } from '@/data/types'
import { formatRelativeDay, formatTime } from '@/lib/dates'
import { useCurrentUser } from '@/providers/session-provider'
import { useThemeColors } from '@/theme/colors'

const PAGE_SIZE = 30

export default function ActivityLogScreen() {
  const profile = useCurrentUser()
  const colors = useThemeColors()
  const insets = useSafeAreaInsets()
  const [logs, setLogs] = useState<LogEntry[] | null>(null)
  const [total, setTotal] = useState<number | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const cursor = useRef<LogsPage['cursor']>(null)
  const hasMore = useRef(true)

  const fetchFirstPage = useCallback(() => {
    getUserLogsCount(profile.id).then(setTotal)
    return getLogsPage(profile.id, PAGE_SIZE).catch((): LogsPage => ({ logs: [], cursor: null, hasMore: false }))
  }, [profile.id])

  const applyFirstPage = (page: LogsPage) => {
    cursor.current = page.cursor
    hasMore.current = page.hasMore
    setLogs(page.logs)
  }

  useEffect(() => {
    let active = true
    fetchFirstPage().then(page => {
      if (active) applyFirstPage(page)
    })
    return () => {
      active = false
    }
  }, [fetchFirstPage])

  const refresh = async () => {
    setRefreshing(true)
    applyFirstPage(await fetchFirstPage())
    setRefreshing(false)
  }

  const loadMore = async () => {
    if (loadingMore || !hasMore.current || !cursor.current) return
    setLoadingMore(true)
    try {
      const page = await getLogsPage(profile.id, PAGE_SIZE, cursor.current)
      cursor.current = page.cursor
      hasMore.current = page.hasMore
      setLogs(current => [...(current ?? []), ...page.logs])
    } finally {
      setLoadingMore(false)
    }
  }

  if (!logs) return <LoadingState />

  const sections = groupLogsByDay(logs)

  return (
    <SectionList
      className="flex-1 bg-background"
      sections={sections}
      keyExtractor={item => item.id}
      stickySectionHeadersEnabled={false}
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 24 }}
      onEndReached={loadMore}
      onEndReachedThreshold={0.4}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[colors.primary]} tintColor={colors.primary} />}
      ListHeaderComponent={total !== null && total > 0 ? (
        <Text variant="caption" tone="muted" className="pt-2 pb-1">{total} exercícios registrados no total</Text>
      ) : null}
      ListEmptyComponent={<EmptyState icon={History} title="Nenhuma atividade registrada" description="Os exercícios concluídos aparecem aqui, agrupados por dia." />}
      ListFooterComponent={loadingMore ? <ActivityIndicator color={colors.primary} className="py-4" /> : null}
      renderSectionHeader={({ section }) => (
        <View className="flex-row items-baseline justify-between pt-5 pb-2 px-1">
          <Text className="text-base font-semibold">{formatRelativeDay(section.dateKey)}</Text>
          <Text variant="caption" tone="subtle">{section.data.length} {section.data.length === 1 ? 'exercício' : 'exercícios'}</Text>
        </View>
      )}
      renderItem={({ item, index, section }) => (
        <View
          className={[
            'bg-surface border-x border-border px-4 py-3 flex-row gap-3',
            index === 0 ? 'rounded-t-2xl border-t' : '',
            index === section.data.length - 1 ? 'rounded-b-2xl border-b' : 'border-b',
          ].join(' ')}
        >
          <View className="flex-1 gap-0.5">
            <Text className="text-base font-medium">{item.titulo}</Text>
            <Text variant="caption" tone="muted">{describeLog(item)}</Text>
          </View>
          <Text variant="caption" tone="subtle">{formatTime(item.data)}</Text>
        </View>
      )}
    />
  )
}
