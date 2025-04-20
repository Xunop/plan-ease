import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateRandomUsername(length: number = 8): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let username = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    username += characters[randomIndex];
  }
  
  return username;
}

export function generateRandomColor(): string {
  const getRandomChannelValue = () => Math.floor(Math.random() * 156) + 100; // Keep the value of each channel between 100 and 255 to avoid overly dim colors.

  const r = getRandomChannelValue(); // red
  const g = getRandomChannelValue(); // green
  const b = getRandomChannelValue(); // blue

  // RGB to hex
  const color = `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1).toUpperCase()}`;
  
  return color;
}

export * from './cssVar'
// export * from './getConnectionText'
export * from './getRenderContainer'
// export * from './isCustomNodeSelected'
export * from './isTextSelected'
