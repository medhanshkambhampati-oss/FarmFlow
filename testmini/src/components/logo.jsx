import { Leaf } from 'lucide-react';
import { cn } from '@/lib/utils.js';

export function Logo({ className }) {
  return <Leaf className={cn('h-6 w-6', className)} />;
}
