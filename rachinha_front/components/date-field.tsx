"use client"

import { useState } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"
import { Control, FieldPath, FieldValues } from "react-hook-form"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"

interface DateFieldProps<T extends FieldValues, K extends FieldPath<T>> {
  control: Control<T>
  name: K
  label?: string
  placeholder?: string
}

export function DateField<T extends FieldValues, K extends FieldPath<T>>({
  control,
  name,
  label = "Data do Racha",
  placeholder = "Data",
}: DateFieldProps<T, K>) {
  const [isCalendarOpen, setCalendarOpen] = useState(false)

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-sm font-medium text-zinc-200">
            {label}
          </FormLabel>
          <Popover open={isCalendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full pl-10 text-left font-normal text-sm bg-zinc-800 border-zinc-700 hover:border-green-500 hover:ring-green-500 flex items-center justify-start relative",
                    !field.value && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="h-4 w-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  {field.value ? (
                    format(field.value, "dd/MM/yyyy", { locale: ptBR })
                  ) : (
                    <span>{placeholder}</span>
                  )}
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 z-[9999]" align="start">
              <Calendar
                mode="single"
                selected={field.value}
                onSelect={(date: Date | undefined) => {
                  if (!date) return;
                  field.onChange(date)
                  setCalendarOpen(false)
                }}
              />
            </PopoverContent>
          </Popover>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
