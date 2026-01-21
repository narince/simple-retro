import React from 'react';

export const VozolIcon = ({ className }: { className?: string }) => (
    <svg
        viewBox="0 0 30 60"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        preserveAspectRatio="xMidYMid meet"
    >
        {/* Mouthpiece */}
        <path d="M10 2C10 0.89543 10.8954 0 12 0H18C19.1046 0 20 0.89543 20 2V6H10V2Z" fill="#A3E635" />

        {/* Cap (Lime Green) */}
        <path d="M0 10C0 7.79086 1.79086 6 4 6H26C28.2091 6 30 7.79086 30 10V20H0V10Z" fill="#84CC16" />

        {/* Body (White with Border) */}
        <path d="M0 20H30V52C30 56.4183 26.4183 60 22 60H8C3.58172 60 0 56.4183 0 52V20Z" fill="white" className="dark:fill-zinc-100" />
        <path d="M0.5 20V52C0.5 56.1421 3.85786 59.5 8 59.5H22C26.1421 59.5 29.5 56.1421 29.5 52V20H0.5Z" stroke="#E2E8F0" className="dark:stroke-slate-700" />

        {/* Vertical Text "VOZOL" - Centered perfectly in body area (shifted down to y=42 to avoid cap) */}
        <text
            x="15"
            y="42"
            textAnchor="middle"
            dominantBaseline="central"
            transform="rotate(-90, 15, 42)"
            fill="#65A30D"
            fontSize="6"
            fontWeight="bold"
            style={{ letterSpacing: '0.5px', fontFamily: 'Arial, sans-serif' }}
        >
            VOZOL
        </text>
    </svg>
);
