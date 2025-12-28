import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}


export const emailToName = (email: string | null) => {
    if (!email) {
        return "(unknown user)"
    }
    const parts = email.split("@")
    if (parts.length <= 1) {
        return email
    }
    return parts[0]
}