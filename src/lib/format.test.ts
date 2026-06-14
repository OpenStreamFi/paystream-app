import { describe, it, expect } from "vitest";
import { formatTimeRemaining } from "./format";

describe("formatTimeRemaining", () => {
  it("returns 'Ended' when past or at the end time", () => {
    expect(formatTimeRemaining(1000, 1000)).toBe("Ended");
    expect(formatTimeRemaining(1000, 1001)).toBe("Ended");
    expect(formatTimeRemaining(1000, 1500)).toBe("Ended");
  });

  it("handles days left correctly", () => {
    // Exactly 2 days remaining
    expect(formatTimeRemaining(1000 + 86400 * 2, 1000)).toBe("2 days left");
    // 1 day remaining
    expect(formatTimeRemaining(1000 + 86400, 1000)).toBe("1 day left");
    // 1 day and 5 hours remaining (rounds down to largest unit, so days)
    expect(formatTimeRemaining(1000 + 86400 + 3600 * 5, 1000)).toBe("1 day left");
  });

  it("handles hours left correctly", () => {
    // Exactly 5 hours remaining
    expect(formatTimeRemaining(1000 + 3600 * 5, 1000)).toBe("5 hours left");
    // 1 hour remaining
    expect(formatTimeRemaining(1000 + 3600, 1000)).toBe("1 hour left");
    // 1 hour and 30 minutes remaining
    expect(formatTimeRemaining(1000 + 3600 + 1800, 1000)).toBe("1 hour left");
  });

  it("handles minutes left correctly", () => {
    // Exactly 30 minutes remaining
    expect(formatTimeRemaining(1000 + 60 * 30, 1000)).toBe("30 minutes left");
    // 1 minute remaining
    expect(formatTimeRemaining(1000 + 60, 1000)).toBe("1 minute left");
    // 1 minute and 45 seconds remaining
    expect(formatTimeRemaining(1000 + 105, 1000)).toBe("1 minute left");
  });

  it("handles seconds left correctly", () => {
    // Exactly 10 seconds remaining
    expect(formatTimeRemaining(1000 + 10, 1000)).toBe("10 seconds left");
    // 1 second remaining
    expect(formatTimeRemaining(1000 + 1, 1000)).toBe("1 second left");
  });

  it("defaults nowSec to current time if not provided", () => {
    const now = Math.floor(Date.now() / 1000);
    // 5 seconds in the past should return Ended
    expect(formatTimeRemaining(now - 5)).toBe("Ended");
    // 10 seconds in the future should return a relative countdown
    expect(formatTimeRemaining(now + 10)).toMatch(/^(10|9|8) seconds left$/);
  });
});
