import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Matches Tailwind's `sm` breakpoint — use for JS-side mobile detection. */
export const MOBILE_BREAKPOINT = 640;
