import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { createContext, useContext } from 'react';
import * as v from 'valibot';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function createContextFactory<ContextData>(options?: {
  defaultValue?: ContextData | null;
  errorMessage?: string;
}) {
  const opts = {
    defaultValue: null,
    errorMessage: 'useContext must be used within a Provider',
    ...options,
  };

  const context = createContext<ContextData | null>(opts.defaultValue);

  function useContextFactory(): ContextData {
    const contextValue = useContext(context);
    if (contextValue === null) {
      throw new Error(opts.errorMessage);
    }
    return contextValue;
  }

  return [context.Provider, useContextFactory] as const;
}

export const validateItemHeight = (min: number, max: number) => (input: number) => {
  const result = v.safeParse(v.pipe(v.number(), v.minValue(min), v.maxValue(max)), input);

  if (!result.success && result.issues && result.issues.length > 0) {
    const rangeIssue = result.issues.find(
      (issue) => issue.type === 'min_value' || issue.type === 'max_value',
    );

    if (rangeIssue) {
      return rangeIssue.requirement;
    }
  }

  return input;
};
