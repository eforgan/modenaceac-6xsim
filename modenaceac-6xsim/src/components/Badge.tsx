import React from 'react';

type BadgeVariant = 'bv' | 'bd' | 'bm' | 'bc' | 'be' | 'bco' | 'bp' | 'bo' | 'bmt' | 'bvn' | 'bpv';

interface BadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ variant, children }) => {
  return <span className={`badge ${variant}`}>{children}</span>;
};
