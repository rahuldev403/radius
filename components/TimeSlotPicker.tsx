"use client";

import { useState } from "react";
import { format, addMinutes, isBefore, isAfter, parseISO } from "date-fns";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type TimeSlot = {
  start: Date;
  end: Date;
  available: boolean;
};

type TimeSlotPickerProps = {
  selectedDate: Date;
  existingBookings: { start_time: string; end_time: string }[];
  onSelectSlot: (start: Date, end: Date) => void;
  selectedSlot: { start: Date; end: Date } | null;
  duration?: number; // in minutes, default 60
};

export function TimeSlotPicker({
  selectedDate,
  existingBookings,
  onSelectSlot,
  selectedSlot,
  duration = 60,
}: TimeSlotPickerProps) {
  // Generate time slots from 9 AM to 6 PM
  const generateTimeSlots = (): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const startHour = 9;
    const endHour = 18;

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const slotStart = new Date(selectedDate);
        slotStart.setHours(hour, minute, 0, 0);

        const slotEnd = addMinutes(slotStart, duration);

        // Check if this slot conflicts with any existing booking
        const isAvailable = !existingBookings.some((booking) => {
          // Parse time-only strings (HH:MM:SS format) and combine with the selected date
          const bookingStart = new Date(selectedDate);
          const [startHour, startMin, startSec] = booking.start_time
            .split(":")
            .map(Number);
          bookingStart.setHours(startHour, startMin, startSec || 0, 0);

          const bookingEnd = new Date(selectedDate);
          const [endHour, endMin, endSec] = booking.end_time
            .split(":")
            .map(Number);
          bookingEnd.setHours(endHour, endMin, endSec || 0, 0);

          // Check for overlap
          return (
            (isBefore(slotStart, bookingEnd) &&
              isAfter(slotEnd, bookingStart)) ||
            (isBefore(bookingStart, slotEnd) && isAfter(bookingEnd, slotStart))
          );
        });

        slots.push({
          start: slotStart,
          end: slotEnd,
          available: isAvailable,
        });
      }
    }

    return slots;
  };

  const timeSlots = generateTimeSlots();

  const isSelected = (slot: TimeSlot) => {
    if (!selectedSlot) return false;
    return (
      slot.start.getTime() === selectedSlot.start.getTime() &&
      slot.end.getTime() === selectedSlot.end.getTime()
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800">
        <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg">
          <Clock className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Select Time Slot
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {duration} minute sessions •{" "}
            {timeSlots.filter((s) => s.available).length} slots available
          </p>
        </div>
      </div>

      {/* Time Slots Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-80 overflow-y-auto p-2 bg-gray-50 dark:bg-gray-900/50 rounded-xl custom-scrollbar">
        {timeSlots.map((slot, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            disabled={!slot.available}
            onClick={() => onSelectSlot(slot.start, slot.end)}
            className={`relative text-sm font-medium transition-all duration-200 ${
              isSelected(slot)
                ? "bg-gradient-to-br from-emerald-500 to-teal-500 text-white border-emerald-600 shadow-lg shadow-emerald-500/30 scale-105"
                : slot.available
                ? "bg-white dark:bg-gray-800 hover:bg-gradient-to-br hover:from-emerald-50 hover:to-teal-50 dark:hover:from-emerald-950/50 dark:hover:to-teal-950/50 hover:border-emerald-400 hover:shadow-md border-gray-200 dark:border-gray-700"
                : "opacity-40 cursor-not-allowed bg-gray-100 dark:bg-gray-900 border-gray-200 dark:border-gray-800 line-through"
            }`}
          >
            {isSelected(slot) && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full border-2 border-emerald-600 shadow-sm" />
            )}
            {format(slot.start, "h:mm a")}
          </Button>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gradient-to-br from-emerald-500 to-teal-500 rounded shadow-sm" />
          <span className="text-gray-700 dark:text-gray-300 font-medium">
            Selected
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded" />
          <span className="text-gray-700 dark:text-gray-300 font-medium">
            Available
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-100 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 rounded opacity-50" />
          <span className="text-gray-700 dark:text-gray-300 font-medium">
            Booked
          </span>
        </div>
      </div>
    </div>
  );
}
