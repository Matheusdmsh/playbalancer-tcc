import { DayPicker, PropsSingle } from "react-day-picker";
import { ptBR } from "date-fns/locale";
import "react-day-picker/style.css";
import clsx from "clsx";

type CalendarProps = PropsSingle;

function Calendar(props: CalendarProps) {
  return (
    <div
      className={clsx(
        "p-1 rounded-lg bg-card text-card-foreground border border-border",
        "shadow-sm w-fit"
      )}
    >
      <DayPicker
        locale={ptBR}
        disabled={{ before: new Date() }}
        className="!bg-transparent"
        classNames={{
          today: "text-green-500 font-bold hover:text-green-500",
          chevron: "fill-current text-green-500 hover:text-green-500",
          selected: "bg-green-500 hover:bg-green-600 !text-white",
          caption: "flex justify-center pt-1 relative items-center",
          caption_label: "text-m font-medium p-2",
          nav_button:
            "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
          table: "w-full border-collapse",
          head_row: "flex",
          head_cell:
            "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
          row: "flex w-full mt-2",
          cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-selected)]:bg-accent [&:has([aria-selected].day-selected)]:text-accent-foreground focus-within:relative focus-within:z-20",
          day: clsx(
            "h-9 w-9 p-0 font-normal aria-selected:opacity-100 rounded-md",
            "hover:bg-accent hover:text-accent-foreground transition-colors"
          ),
        }}
        {...props}
        
      />
    </div>
  );
}

export { Calendar };