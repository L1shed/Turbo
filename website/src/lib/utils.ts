import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { NodeStats } from "@/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Extract earnings data from multiple nodes' dailyEarnings JSON structure
 * and convert to 7-day array for chart display (optimized for speed)
 * Index 0 = 6 days ago, Index 6 = today
 */
export function extractEarningsHistory(nodes: NodeStats[]): number[] {
  // Initialize 7-day array [6 days ago, 5 days ago, ..., yesterday, today]
  const earningsArray = [0, 0, 0, 0, 0, 0, 0];
  const today = new Date();
  
  // Loop through all nodes and aggregate earnings
  nodes.forEach(node => {
    if (node.dailyEarnings) {
      Object.entries(node.dailyEarnings).forEach(([dateString, earnings]) => {
        // Calculate days difference from today
        const earningsDate = new Date(dateString);
        const daysDiff = Math.floor((today.getTime() - earningsDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // Only include earnings from the last 7 days
        if (daysDiff >= 0 && daysDiff < 7) {
          const arrayIndex = 6 - daysDiff; // Convert to array index (today = index 6)
          earningsArray[arrayIndex] += earnings;
        }
      });
    }
  });

  return earningsArray;
}

/**
 * Calculate today's earnings from nodes' dailyEarnings JSON
 */
export function calculateTodayEarnings(nodes: NodeStats[]): number {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  
  return nodes.reduce((total, node) => {
    const todayEarnings = node.dailyEarnings[today] || 0;
    return total + todayEarnings;
  }, 0);
}

/**
 * Calculate total earnings from nodes' dailyEarnings JSON
 */
export function calculateTotalEarnings(nodes: NodeStats[]): number {
  return nodes.reduce((total, node) => {
    const nodeTotal = Object.values(node.dailyEarnings).reduce((sum, earnings) => sum + earnings, 0);
    return total + nodeTotal;
  }, 0);
}
