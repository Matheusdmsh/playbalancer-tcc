"use client"

import { Control } from "react-hook-form"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { INPUT_STYLES } from "@/lib/groupFormConstants"

interface TimeFieldProps {
  control: Control<any>
  name?: string
  label?: string
}

export function TimeField({ control, name = "startTime", label = "Horário" }: TimeFieldProps) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const [hours, minutes] = field.value ? field.value.split(':') : ['', '']
        return (
          <FormItem>
            <FormLabel className="text-sm font-medium text-zinc-200">
              {label}
            </FormLabel>
            <FormControl>
              <div className="grid grid-cols-2 gap-2">
                <Select 
                  value={hours} 
                  onValueChange={(h) => {
                    field.onChange(`${h}:00`)
                  }}
                >
                  <SelectTrigger className={INPUT_STYLES.select}>
                    <SelectValue placeholder="HH" />
                  </SelectTrigger>
                  <SelectContent className={`${INPUT_STYLES.selectContent} max-h-[200px]`}>
                    {Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0')).map(h => (
                      <SelectItem key={h} value={h}>{h}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select 
                  value={hours ? (minutes || '00') : ''}
                  onValueChange={(m) => {
                    const h = hours || '00'
                    field.onChange(`${h}:${m}`)
                  }}
                  disabled={!hours}
                >
                  <SelectTrigger className={INPUT_STYLES.select}>
                    <SelectValue placeholder="MM" />
                  </SelectTrigger>
                  <SelectContent className={INPUT_STYLES.selectContent}>
                    <SelectItem value="00">00</SelectItem>
                    <SelectItem value="30">30</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )
      }}
    />
  )
}
