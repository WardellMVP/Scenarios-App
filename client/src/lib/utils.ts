import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format date in a human-readable format
export function formatDate(dateString?: string): string {
  if (!dateString) return 'Never';
  
  const date = new Date(dateString);
  return date.toLocaleString();
}

// Format duration in a human-readable format
export function formatDuration(seconds?: number): string {
  if (!seconds) return '0s';
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes === 0) {
    return `${remainingSeconds}s`;
  }
  
  return `${minutes}m ${remainingSeconds}s`;
}

// Format relative time (e.g., "5 minutes ago")
export function formatRelativeTime(dateString?: string): string {
  if (!dateString) return 'Never';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffSecs < 60) {
    return 'just now';
  } else if (diffMins < 60) {
    return `${diffMins} min ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hours ago`;
  } else {
    return `${diffDays} days ago`;
  }
}

// Parse console output for colorizing
export function parseConsoleOutput(output?: string): { text: string; className: string }[] {
  if (!output) return [];
  
  const lines = output.split('\n');
  
  return lines.map(line => {
    // INFO lines - green
    if (line.includes('[INFO]')) {
      return { text: line, className: 'text-green-400' };
    }
    // WARN lines - yellow
    else if (line.includes('[WARN]')) {
      return { text: line, className: 'text-yellow-400' };
    }
    // ERROR lines - red
    else if (line.includes('[ERROR]') || line.includes('[VULN]')) {
      return { text: line, className: 'text-red-400' };
    }
    // DEFAULT - gray
    else {
      return { text: line, className: 'text-gray-300' };
    }
  });
}
