import React, { useState, useEffect } from 'react';
import { evaluate } from 'mathjs';
import { cn } from '../lib/utils';

interface CalculatorFieldProps {
  onValueChange: (val: number) => void;
  value?: string | number;
  className?: string;
  placeholder?: string;
  [key: string]: any;
}

export function CalculatorField({ onValueChange, className, value, ...props }: CalculatorFieldProps) {
  const [expr, setExpr] = useState(value?.toString() || '');
  const [error, setError] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    // Only update expr from prop if not currently focused 
    // to avoid interrupting formula entry
    if (value !== undefined && !isFocused) {
      setExpr(value.toString());
    }
  }, [value, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setExpr(val);
    
    try {
      if (val.startsWith('=')) {
        const toEval = val.substring(1);
        if (toEval.trim() === '') {
          onValueChange(0);
          setError(false);
          return;
        }
        const result = evaluate(toEval);
        if (typeof result === 'number' && !isNaN(result)) {
          onValueChange(result);
          setError(false);
        } else {
          setError(true);
        }
      } else {
        // Plain number mode
        if (val.trim() === '' || val === '-') {
          onValueChange(0);
          setError(false);
          return;
        }
        const num = Number(val);
        if (!isNaN(num)) {
          onValueChange(num);
          setError(false);
        } else {
          setError(true);
        }
      }
    } catch (err) {
      setError(true);
    }
  };

  return (
    <div className="relative group w-full">
      <input
        {...props}
        type="text"
        value={expr}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onChange={handleChange}
        className={cn(
          "w-full bg-gray-50 border border-wise-border rounded-lg px-3 py-2 text-wise-dark font-bold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-50 transition-all",
          error && expr.length > 0 && "border-red-300 ring-red-50 bg-red-50/20",
          className
        )}
      />
    </div>
  );
}
