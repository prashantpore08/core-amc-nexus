import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Hours allocation calculation utilities
export function calculateHoursAllocation(annualHours: number, paymentTerm: string) {
  const monthly = annualHours / 12;
  
  switch (paymentTerm) {
    case 'Monthly':
      return {
        monthly,
        quarterly: monthly * 3,
        halfYearly: monthly * 6,
        yearly: annualHours,
        breakdown: {
          perMonth: monthly,
          perQuarter: monthly * 3,
          perHalfYear: monthly * 6,
          perYear: annualHours
        }
      };
    case 'Quarterly':
      return {
        quarterly: annualHours / 4,
        monthly,
        yearly: annualHours,
        breakdown: {
          perMonth: monthly,
          perQuarter: annualHours / 4,
          perYear: annualHours
        }
      };
    case 'Half-Yearly':
      return {
        halfYearly: annualHours / 2,
        monthly,
        yearly: annualHours,
        breakdown: {
          perMonth: monthly,
          perHalfYear: annualHours / 2,
          perYear: annualHours
        }
      };
    case 'Yearly':
      return {
        yearly: annualHours,
        monthly,
        breakdown: {
          perMonth: monthly,
          perYear: annualHours
        }
      };
    default:
      return {
        monthly,
        yearly: annualHours,
        breakdown: {
          perMonth: monthly,
          perYear: annualHours
        }
      };
  }
}

// Format currency with rupee symbol
export function formatRupees(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}
