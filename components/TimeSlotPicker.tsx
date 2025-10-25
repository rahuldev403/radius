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
          const bookingStart = parseISO(booking.start_time);
          const bookingEnd = parseISO(booking.end_time);

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
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Clock className="w-4 h-4" />
        <span>Available Time Slots ({duration} min sessions)</span>
      </div>

      <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto p-1">
        {timeSlots.map((slot, index) => (
          <Button
            key={index}
            variant={isSelected(slot) ? "default" : "outline"}
            size="sm"
            disabled={!slot.available}
            onClick={() => onSelectSlot(slot.start, slot.end)}
            className={`text-xs ${
              isSelected(slot)
                ? "bg-emerald-600 hover:bg-emerald-700"
                : slot.available
                ? "hover:bg-emerald-50 hover:border-emerald-300"
                : "opacity-50 cursor-not-allowed"
            }`}
          >
            {format(slot.start, "h:mm a")}
          </Button>
        ))}
      </div>

      <div className="flex items-center gap-4 text-xs text-gray-500 pt-2 border-t">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-emerald-600 rounded" />
          <span>Selected</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 border border-gray-300 rounded" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-gray-200 border border-gray-300 rounded" />
          <span>Booked</span>
        </div>
      </div>
    </div>
  );
}
