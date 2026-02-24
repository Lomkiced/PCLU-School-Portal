/**
 * Time Math Utilities for CSS Grid Timetable
 * Maps "HH:mm" time blocks to CSS Grid rows proportionally.
 */

export function getDurationInMinutes(startTime: string, endTime: string): number {
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    return (endH * 60 + endM) - (startH * 60 + startM);
}

export function getGridRowStart(startTime: string, baseHour: number = 7, headerOffset: number = 1): number {
    const [h, m] = startTime.split(':').map(Number);
    const minutesFromBase = (h - baseHour) * 60 + m;
    // 1 row = 15 minutes.
    // CSS Grid rows are 1-indexed. If header is row 1, 7:00 AM starts at row 2.
    return Math.floor(minutesFromBase / 15) + headerOffset + 1;
}

export function getGridRowSpan(durationMinutes: number): number {
    // 1 row = 15 minutes
    return Math.max(1, Math.round(durationMinutes / 15));
}

export function getDayColumn(dayOfWeek: string): number {
    const days = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];
    const index = days.indexOf(dayOfWeek.toUpperCase());
    // Column 1 is time labels, so Monday is Column 2
    return index >= 0 ? index + 2 : 2;
}
