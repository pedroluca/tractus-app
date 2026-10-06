import { twMerge } from 'tailwind-merge'

type ClassValue = string | false | null | undefined

/** Junta classes resolvendo conflitos (ex.: "text-base" + "text-sm" fica só "text-sm") */
export function cn(...classes: ClassValue[]): string {
  return twMerge(classes.filter(Boolean).join(' '))
}
