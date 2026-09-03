"use client";

import * as Popover from "@radix-ui/react-popover";
import { Calendar } from "lucide-react";
import { useId, useState } from "react";
import { DayPicker } from "react-day-picker";
import { es } from "react-day-picker/locale";
import "react-day-picker/style.css";
import { formatDate } from "../../../lib/format";

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function fromIsoDate(value?: string): Date | undefined {
  if (!value) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day);
}

interface Props {
  id?: string;
  name: string;
  defaultValue?: string;
  disabled?: boolean;
  placeholder?: string;
}

const currentYear = new Date().getFullYear();
const NAV_START = new Date(currentYear - 80, 0, 1);
const NAV_END = new Date(currentYear + 15, 11, 31);

export function DatePicker({ id, name, defaultValue, disabled, placeholder = "Selecciona una fecha" }: Props) {
  const [selected, setSelected] = useState<Date | undefined>(() => fromIsoDate(defaultValue));
  const [open, setOpen] = useState(false);
  const generatedId = useId();
  const triggerId = id ?? generatedId;

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <input type="hidden" name={name} value={selected ? toIsoDate(selected) : ""} disabled={disabled} />
      <Popover.Trigger asChild>
        <button
          id={triggerId}
          type="button"
          disabled={disabled}
          className="flex w-full items-center justify-between gap-2 rounded-md border border-neutral-200 px-3 py-2 text-left text-sm focus:border-primary focus:outline-none disabled:bg-neutral-100 disabled:text-neutral-400"
        >
          <span className={selected ? "text-neutral-900" : "text-neutral-400"}>
            {selected ? formatDate(selected) : placeholder}
          </span>
          <Calendar size={16} className="shrink-0 text-neutral-400" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={4}
          className="z-50 rounded-xl border border-neutral-200 bg-white p-3 shadow-lg outline-none data-[state=open]:animate-[scale-in_150ms_ease-out] data-[state=closed]:animate-[scale-out_100ms_ease-in]"
        >
          <DayPicker
            mode="single"
            locale={es}
            selected={selected}
            defaultMonth={selected}
            captionLayout="dropdown"
            startMonth={NAV_START}
            endMonth={NAV_END}
            onSelect={(date) => {
              setSelected(date);
              setOpen(false);
            }}
            classNames={{
              day_button: "rounded-md text-sm hover:bg-primary-50",
              selected: "bg-primary text-white rounded-md",
              today: "text-accent-700 font-semibold",
              caption_label: "text-sm font-semibold text-neutral-900",
              months_dropdown: "text-sm font-semibold text-neutral-900",
              years_dropdown: "text-sm font-semibold text-neutral-900",
              chevron: "fill-primary",
            }}
          />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
