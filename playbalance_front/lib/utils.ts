import { clsx, type ClassValue } from "clsx"
import axios from "axios"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


/**
 * Converte uma string de data (potencialmente sem 'Z') para um objeto Date,
 * garantindo que seja interpretada como UTC.
 * @param dateString A string de data vinda da API.
 * @returns Um objeto Date.
 */
export function parseUTCDate(dateString: string | undefined | null): Date | null {
  if (!dateString) {
    return null;
  }
  // Se a string já não terminar com 'Z', adiciona para garantir a interpretação UTC.
  if (!dateString.endsWith('Z')) {
    return new Date(`${dateString}Z`);
  }
  return new Date(dateString);
}

interface ApiErrorData {
  detail?: unknown
  message?: unknown
}

function getErrorText(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) return value
  if (value == null) return undefined

  try {
    return JSON.stringify(value)
  } catch {
    return undefined
  }
}

export function handleApiError(error: unknown, defaultMessage: string): Error {
  if (axios.isAxiosError<ApiErrorData>(error)) {
    const apiMessage =
      getErrorText(error.response?.data?.detail) ??
      getErrorText(error.response?.data?.message)
    return new Error(apiMessage ?? defaultMessage)
  }

  return new Error(error instanceof Error ? error.message : defaultMessage)
}
