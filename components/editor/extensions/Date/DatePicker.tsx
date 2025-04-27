"use client";

import * as React from "react";
import { Icon } from "@/components/ui/icon";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { dateObjectToDateString, dateStringToDateObject } from "./utils"; // Adjust path

interface DatePickerProps {
  // Value from node.attrs.dateValue (yyyy-mm-dd)
  value: string | null;
  // Callback when a date is selected
  onSelectDate: (date: Date | undefined) => void;
  // Manage Popover visibility externally
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DatePickerWrapper({
  value,
  onSelectDate,
  open,
  onOpenChange,
}: DatePickerProps) {
  const selectedDate = React.useMemo(
    () => dateStringToDateObject(value),
    [value],
  );

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        {/* Use your preferred trigger - icon button is common */}
        <Button
          variant={"outline"}
          size="icon"
          className="h-6 w-6 p-0" // Adjust size as needed
          aria-label="Pick a date"
        >
          <Icon name="Calendar" className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={onSelectDate} // Pass the callback directly
          initialFocus // Focus calendar when opened
          // Add other react-day-picker props as needed
          // E.g., disabled dates, month navigation limits etc.
        />
      </PopoverContent>
    </Popover>
  );
}
