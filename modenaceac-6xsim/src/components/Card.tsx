import React from 'react';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export const Card: React.FC<CardProps> = ({ title, children, style }) => {
  return (
    <div className="card" style={style}>
      {title && <div className="ct">{title}</div>}
      {children}
    </div>
  );
};
