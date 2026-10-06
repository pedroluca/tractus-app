import { useState } from 'react'
import { View } from 'react-native'
import { Button } from '@/components/ui/button'
import { Sheet } from '@/components/ui/sheet'
import { TextField } from '@/components/ui/text-field'

type NoteSheetProps = {
  visible: boolean
  onClose: () => void
  initialNote: string
  exerciseTitle: string
  onSave: (note: string) => void
}

/** Montado só enquanto aberto, então o rascunho sempre começa da nota salva */
export function NoteSheet({ visible, onClose, initialNote, exerciseTitle, onSave }: NoteSheetProps) {
  const [note, setNote] = useState(initialNote)

  return (
    <Sheet visible={visible} onClose={onClose} title="Anotação" description={exerciseTitle}>
      <View className="gap-4 pb-2">
        <TextField
          value={note}
          onChangeText={setNote}
          placeholder="Ex.: foco na contração, descer devagar, banco na posição 3..."
          multiline
          maxLength={1000}
          autoFocus
        />
        <View className="flex-row gap-2">
          <Button label="Cancelar" variant="secondary" className="flex-1" onPress={onClose} />
          <Button
            label="Salvar"
            className="flex-1"
            onPress={() => {
              onSave(note)
              onClose()
            }}
          />
        </View>
      </View>
    </Sheet>
  )
}
