import { addDoc, collection, deleteDoc, doc, onSnapshot, query, updateDoc, where } from '@react-native-firebase/firestore'
import { db } from '@/lib/firebase'
import type { BodyMeasurement } from './types'

export function calculateBmi(weightKg: number, heightCm: number): number {
  if (!weightKg || !heightCm) return 0
  const meters = heightCm / 100
  return weightKg / (meters * meters)
}

export type BmiCategory = { label: string; tone: 'info' | 'success' | 'warning' | 'danger' }

export function getBmiCategory(bmi: number): BmiCategory | null {
  if (!bmi) return null
  if (bmi < 18.5) return { label: 'Abaixo do peso', tone: 'info' }
  if (bmi < 25) return { label: 'Normal', tone: 'success' }
  if (bmi < 30) return { label: 'Sobrepeso', tone: 'warning' }
  return { label: 'Obesidade', tone: 'danger' }
}

export function subscribeMeasurements(userId: string, onChange: (measurements: BodyMeasurement[]) => void, onError?: (error: Error) => void) {
  return onSnapshot(
    query(collection(db, 'medicoescorporais'), where('usuarioID', '==', userId)),
    snapshot => onChange(
      snapshot.docs
        .map(measurementDoc => ({ id: measurementDoc.id, ...measurementDoc.data() } as BodyMeasurement))
        .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()),
    ),
    onError,
  )
}

export class InvalidMeasurementError extends Error {}

/**
 * Registra uma medição e atualiza peso/altura atuais no perfil.
 * Altura em metros (como o usuário digita), peso em kg.
 */
export async function addMeasurement(params: { userId: string; date: Date; weightKg: number; heightM: number; notes?: string }) {
  const heightCm = Math.round(params.heightM * 100)
  if (!params.weightKg || !heightCm || params.weightKg < 20 || params.weightKg > 500 || heightCm < 50 || heightCm > 300) {
    throw new InvalidMeasurementError('Valores inválidos. Altura entre 0,50 e 3,00 m e peso entre 20 e 500 kg.')
  }

  const bmi = calculateBmi(params.weightKg, heightCm)
  const data: Record<string, unknown> = {
    usuarioID: params.userId,
    data: params.date.toISOString(),
    peso: params.weightKg,
    altura: heightCm,
    imc: Number(bmi.toFixed(1)),
  }
  if (params.notes?.trim()) data.notas = params.notes.trim()

  await addDoc(collection(db, 'medicoescorporais'), data)
  await updateDoc(doc(db, 'usuarios', params.userId), { peso: params.weightKg, altura: heightCm })
}

export async function deleteMeasurement(measurementId: string) {
  await deleteDoc(doc(db, 'medicoescorporais', measurementId))
}
