// Wallet icons as React components (official logos)
import React from 'react';

interface IconProps {
  className?: string;
}

// MetaMask Official Logo - Fox
export const MetaMaskIcon: React.FC<IconProps> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 35 33" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M32.9582 1L19.8241 10.7183L22.2665 4.99099L32.9582 1Z" fill="#E17726" stroke="#E17726" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2.66296 1L15.6849 10.809L13.3542 4.99098L2.66296 1Z" fill="#E27625" stroke="#E27625" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M28.2295 23.5334L24.7346 28.872L32.2173 30.9323L34.3622 23.6501L28.2295 23.5334Z" fill="#E27625" stroke="#E27625" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M1.27271 23.6501L3.40553 30.9323L10.8883 28.872L7.40524 23.5334L1.27271 23.6501Z" fill="#E27625" stroke="#E27625" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10.4706 14.5149L8.39209 17.6507L15.7978 17.9891L15.5503 9.94043L10.4706 14.5149Z" fill="#E27625" stroke="#E27625" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M25.1505 14.5149L19.9941 9.84961L19.8241 17.9891L27.2298 17.6507L25.1505 14.5149Z" fill="#E27625" stroke="#E27625" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10.8883 28.8721L15.3565 26.7009L11.4828 23.6968L10.8883 28.8721Z" fill="#E27625" stroke="#E27625" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M20.2646 26.7009L24.7346 28.8721L24.1382 23.6968L20.2646 26.7009Z" fill="#E27625" stroke="#E27625" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M24.7346 28.8722L20.2646 26.7009L20.6286 29.6133L20.5904 30.8407L24.7346 28.8722Z" fill="#D5BFB2" stroke="#D5BFB2" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10.8883 28.8722L15.0325 30.8407L15.0061 29.6133L15.3565 26.7009L10.8883 28.8722Z" fill="#D5BFB2" stroke="#D5BFB2" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M15.1167 21.7842L11.3734 20.6826L14.0211 19.4736L15.1167 21.7842Z" fill="#233447" stroke="#233447" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M20.5044 21.7842L21.6 19.4736L24.2596 20.6826L20.5044 21.7842Z" fill="#233447" stroke="#233447" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10.8883 28.8721L11.5063 23.5334L7.40527 23.6501L10.8883 28.8721Z" fill="#CC6228" stroke="#CC6228" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M24.1148 23.5334L24.7346 28.8721L28.2295 23.6501L24.1148 23.5334Z" fill="#CC6228" stroke="#CC6228" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M27.2298 17.6506L19.8241 17.989L20.5044 21.7842L21.6 19.4736L24.2596 20.6826L27.2298 17.6506Z" fill="#CC6228" stroke="#CC6228" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M11.3734 20.6826L14.0211 19.4736L15.1167 21.7842L15.7978 17.989L8.39209 17.6506L11.3734 20.6826Z" fill="#CC6228" stroke="#CC6228" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8.39209 17.6506L11.4828 23.6968L11.3734 20.6826L8.39209 17.6506Z" fill="#E27625" stroke="#E27625" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M24.2596 20.6826L24.1382 23.6968L27.2298 17.6506L24.2596 20.6826Z" fill="#E27625" stroke="#E27625" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M15.7978 17.989L15.1167 21.7842L15.9684 26.1809L16.1624 20.3742L15.7978 17.989Z" fill="#E27625" stroke="#E27625" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M19.8241 17.989L19.4713 20.3626L19.6527 26.1809L20.5044 21.7842L19.8241 17.989Z" fill="#E27625" stroke="#E27625" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M20.5044 21.7843L19.6527 26.1809L20.2646 26.7009L24.1382 23.6968L24.2596 20.6826L20.5044 21.7843Z" fill="#F5841F" stroke="#F5841F" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M11.3734 20.6826L11.4828 23.6968L15.3565 26.7009L15.9684 26.1809L15.1167 21.7843L11.3734 20.6826Z" fill="#F5841F" stroke="#F5841F" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M20.5904 30.8407L20.6286 29.6133L20.2882 29.3216H15.333L15.0061 29.6133L15.0325 30.8407L10.8883 28.8721L12.3656 30.0929L15.2858 32.0731H20.3373L23.2575 30.0929L24.7346 28.8721L20.5904 30.8407Z" fill="#C0AC9D" stroke="#C0AC9D" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M20.2646 26.7009L19.6527 26.1809H15.9684L15.3565 26.7009L15.0061 29.6133L15.333 29.3216H20.2882L20.6286 29.6133L20.2646 26.7009Z" fill="#161616" stroke="#161616" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M33.5168 11.3532L34.6124 6.04984L32.9582 1L20.2646 10.3717L25.1505 14.5149L31.9227 16.5168L33.5786 14.5966L32.8601 14.0649L33.9793 13.0451L33.0893 12.3576L34.2086 11.5053L33.5168 11.3532Z" fill="#763E1A" stroke="#763E1A" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M1.00879 6.04984L2.10442 11.3532L1.40066 11.5053L2.52004 12.3576L1.64185 13.0451L2.76123 14.0649L2.04271 14.5966L3.69855 16.5168L10.4706 14.5149L15.3565 10.3717L2.66296 1L1.00879 6.04984Z" fill="#763E1A" stroke="#763E1A" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M31.9227 16.5168L25.1505 14.5149L27.2298 17.6507L24.1382 23.6968L28.2295 23.6501H34.3622L31.9227 16.5168Z" fill="#F5841F" stroke="#F5841F" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10.4706 14.5149L3.69855 16.5168L1.27271 23.6501H7.40524L11.4828 23.6968L8.39209 17.6507L10.4706 14.5149Z" fill="#F5841F" stroke="#F5841F" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M19.8241 17.989L20.2646 10.3717L22.2665 4.99097H13.3542L15.3565 10.3717L15.7978 17.989L15.9566 20.3859L15.9684 26.1809H19.6527L19.6645 20.3859L19.8241 17.989Z" fill="#F5841F" stroke="#F5841F" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Coinbase Wallet Official Logo - Blue with white C
export const CoinbaseWalletIcon: React.FC<IconProps> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 40 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="40" height="40" rx="8" fill="#0052FF"/>
    <circle cx="20" cy="20" r="10" fill="white"/>
    <rect x="16" y="16" width="8" height="8" rx="1" fill="#0052FF"/>
  </svg>
);

// Rabby Wallet Official Logo - Blue with rabbit
export const RabbyIcon: React.FC<IconProps> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 40 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="40" height="40" rx="8" fill="#7084FF"/>
    <ellipse cx="14" cy="13" rx="3" ry="5" fill="white"/>
    <ellipse cx="26" cy="13" rx="3" ry="5" fill="white"/>
    <circle cx="20" cy="22" r="8" fill="white"/>
    <circle cx="17" cy="21" r="1.5" fill="#7084FF"/>
    <circle cx="23" cy="21" r="1.5" fill="#7084FF"/>
    <ellipse cx="20" cy="24" rx="2" ry="1" fill="#FFB6C1"/>
  </svg>
);

// Kepler Wallet Official Logo - Purple/Indigo with ring
export const KeplerIcon: React.FC<IconProps> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 40 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="40" height="40" rx="8" fill="#7B3FE4"/>
    <circle cx="20" cy="20" r="10" stroke="white" strokeWidth="2" fill="none"/>
    <circle cx="20" cy="20" r="4" fill="white"/>
  </svg>
);
