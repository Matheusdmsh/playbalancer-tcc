import { clsx, type ClassValue } from "clsx"
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

export function handleApiError(error: any, defaultMessage: string): Error {
    const message =
      error?.response?.data?.detail ||
      error?.response?.data?.message ||
      error?.message ||
      defaultMessage;
    return new Error(message);
}