import type { Clock } from "@/core/application/ports/clock";

export class FakeClock implements Clock {
  constructor(private current: Date = new Date("2026-01-01T08:00:00.000Z")) {}

  now(): Date {
    return new Date(this.current.getTime());
  }

  set(date: Date): void {
    this.current = date;
  }

  advance(ms: number): void {
    this.current = new Date(this.current.getTime() + ms);
  }
}
