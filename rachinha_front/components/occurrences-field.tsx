"use client"

import { Repeat } from "lucide-react"
import { Control, FieldPath, FieldValues } from "react-hook-form"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { INPUT_STYLES } from "@/lib/groupFormConstants"

interface OccurrencesFieldProps<T extends FieldValues, K extends FieldPath<T>> {
  control: Control<T>
  name: K
  label?: string
  placeholder?: string
  minWeeks?: number
  maxWeeks?: number
}

export function OccurrencesField<T extends FieldValues, K extends FieldPath<T>>({
  control,
  name,
  label = "Repetir por",
  placeholder = "Semanas",
  minWeeks = 2,
  maxWeeks = 12,
}: OccurrencesFieldProps<T, K>) {
  const recurrenceOptions = Array.from(
    { length: maxWeeks - minWeeks + 1 },
    (_, i) => i + minWeeks
  )

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-sm font-medium text-zinc-200">
            {label}
          </FormLabel>
          <Select onValueChange={field.onChange} value={field.value || ""}>
            <FormControl>
              <SelectTrigger className={INPUT_STYLES.select}>
                <div className="flex items-center gap-2">
                  <Repeat className="h-4 w-4 text-zinc-400" />
                  <SelectValue placeholder={placeholder} />
                </div>
              </SelectTrigger>
            </FormControl>
            <SelectContent className={INPUT_STYLES.selectContent}>
              {recurrenceOptions.map((w) => (
                <SelectItem key={w} value={String(w)}>
                  {w} {w === 1 ? "semana" : "semanas"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
