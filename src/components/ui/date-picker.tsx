"use client";

import * as React from "react";
import { format, parse } from "date-fns";
import { ja } from "date-fns/locale";
import { CalendarIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  value?: string; // YYYY-MM-DD format
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

/** 日付選択コンポーネント */
export function DatePicker({
  value,
  onChange,
  placeholder = "日付を選択",
  className,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  // YYYY-MM-DD 形式の文字列を Date に変換
  const date = value ? parse(value, "yyyy-MM-dd", new Date()) : undefined;

  const handleSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      onChange(format(selectedDate, "yyyy-MM-dd"));
    } else {
      onChange("");
    }
    setOpen(false);
  };

  const handleClear = () => {
    onChange("");
  };

  return (
    <div className={cn("relative flex items-center", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground",
              date && "pr-10"
            )}
          >
            <CalendarIcon className="mr-2 size-4 shrink-0" />
            <span className="flex-1">
              {date ? format(date, "yyyy/MM/dd", { locale: ja }) : placeholder}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleSelect}
            defaultMonth={date}
            locale={ja}
          />
        </PopoverContent>
      </Popover>
      {date && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 p-1 text-muted-foreground hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}
