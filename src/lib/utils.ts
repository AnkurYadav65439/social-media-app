import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string): string {
  // Convert date string to Date object
  const currentDate: Date = new Date();
  const providedDate: Date = new Date(date);

  // Calculate the difference in milliseconds
  const difference: number = currentDate.getTime() - providedDate.getTime();

  // Convert milliseconds to seconds, minutes, hours, and days
  const seconds: number = Math.floor(difference / 1000);
  const minutes: number = Math.floor(seconds / 60);
  const hours: number = Math.floor(minutes / 60);
  const days: number = Math.floor(hours / 24);

  if (days > 0) {
    // Return formatted string for days ago
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  } else if (hours > 0) {
    // Return formatted string for hours ago
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  } else {
    // Return formatted string for minutes/seconds ago
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  }
}

export function checkIsLiked(userId: string, likeList: string[]){
  return likeList.includes(userId);
}

//own
export const convertFileToUrl = (file: File) => URL.createObjectURL(file);
