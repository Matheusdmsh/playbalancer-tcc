"use client"

import { Control } from "react-hook-form"
import { Clock, X } from "lucide-react"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { INPUT_STYLES, DURATIONS } from "@/lib/groupFormConstants"

interface DurationFieldProps {
  control: Control<any>
  name?: string
  valueInHours?: boolean // Se true, converte minutos (string) ↔ horas (number)
}

export function DurationField({ control, name = "duration", valueInHours = false }: DurationFieldProps) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-sm font-medium text-zinc-200">
            Duração
          </FormLabel>
          <Select 
            onValueChange={(val) => {
              if (valueInHours) {
                field.onChange(Number(val) / 60) // Converte minutos → horas
              } else {
                field.onChange(val)
              }
            }} 
            value={valueInHours ? (field.value ? String(field.value * 60) : "") : (field.value || "")}
          >
            <FormControl>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none z-10">
                  <Clock className="h-4 w-4" />
                </span>
                <SelectTrigger className={`${INPUT_STYLES.select} pl-10 ${field.value ? 'pr-8' : ''}`}>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                {field.value && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      field.onChange(valueInHours ? undefined : "")
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white z-10"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </FormControl>
            <SelectContent className={INPUT_STYLES.selectContent}>
              {DURATIONS.map((duration) => (
                <SelectItem key={duration.value} value={duration.value}>
                  {duration.label}
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
