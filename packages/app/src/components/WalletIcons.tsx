// Wallet icons as React components (official logos)
import React from 'react';

interface IconProps {
  className?: string;
}

// MetaMask Official Logo
export const MetaMaskIcon: React.FC<IconProps> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 212 189" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M177.649 171.053L118.062 189L117.819 142.293L146.456 132.177L177.649 171.053Z" fill="#E2761B" stroke="#E2761B" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M34.3509 171.053L93.9379 189L94.1809 142.293L65.5439 132.177L34.3509 171.053Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M152.738 69.564L136.264 117.71L117.485 142.503L146.066 133.284L177.059 74.371L152.738 69.564Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M34.9409 74.371L65.9339 133.284L94.5149 142.503L75.7359 117.71L59.2619 69.564L34.9409 74.371Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M94.5149 142.503L117.819 142.293L105.737 157.768L94.5149 142.503Z" fill="#D7C1B3" stroke="#D7C1B3" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M65.5439 132.177L94.5149 142.503L105.737 157.768L65.5439 132.177Z" fill="#233447" stroke="#233447" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M75.736 117.71L59.262 69.564L34.941 74.371L65.934 133.284L75.736 117.71Z" fill="#CD6116" stroke="#CD6116" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M136.264 117.71L152.738 69.564L177.059 74.371L146.066 133.284L136.264 117.71Z" fill="#CD6116" stroke="#CD6116" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M117.819 142.293L146.456 132.177L136.264 117.71L117.819 142.293Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M65.5439 132.177L75.7359 117.71L94.5149 142.503L65.5439 132.177Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M94.5149 142.503L117.819 142.293L117.485 117.71L94.5149 142.503Z" fill="#F6851B" stroke="#F6851B" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M75.736 117.71L59.262 69.564L52.918 97.646L75.736 117.71Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M136.264 117.71L159.082 97.646L152.738 69.564L136.264 117.71Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M117.485 117.71L117.819 142.293L136.264 117.71L159.082 97.646L131.916 95.882L117.485 117.71Z" fill="#F6851B" stroke="#F6851B" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M75.736 117.71L94.5149 117.71L80.0839 95.882L52.918 97.646L75.736 117.71Z" fill="#F6851B" stroke="#F6851B" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M131.916 95.882L159.082 97.646L163.395 64.183L131.916 95.882Z" fill="#CD6116" stroke="#CD6116" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M80.0839 95.882L48.6049 64.183L52.918 97.646L80.0839 95.882Z" fill="#CD6116" stroke="#CD6116" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M117.485 117.71L131.916 95.882L117.819 69.564L117.485 117.71Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M94.5149 117.71L94.1809 69.564L80.0839 95.882L94.5149 117.71Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M117.485 117.71L136.264 117.71L131.916 95.882L117.819 69.564L117.485 117.71Z" fill="#233447" stroke="#233447" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M94.5149 117.71L94.1809 69.564L80.0839 95.882L94.5149 117.71Z" fill="#233447" stroke="#233447" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M80.0839 95.882L94.1809 69.564L52.918 97.646L80.0839 95.882Z" fill="#CD6116" stroke="#CD6116" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M131.916 95.882L117.819 69.564L159.082 97.646L131.916 95.882Z" fill="#CD6116" stroke="#CD6116" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M94.1809 69.564L117.819 69.564L105.737 30.132L94.1809 69.564Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M117.819 69.564L141.457 30.132L129.375 69.564L117.819 69.564Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Coinbase Wallet Official Logo
export const CoinbaseWalletIcon: React.FC<IconProps> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 40 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="40" height="40" rx="8" fill="#0052FF"/>
    <path d="M20 10C14.48 10 10 14.48 10 20C10 25.52 14.48 30 20 30C25.52 30 30 25.52 30 20C30 14.48 25.52 10 20 10ZM16 20C16 17.79 17.79 16 20 16C22.21 16 24 17.79 24 20C24 22.21 22.21 24 20 24C17.79 24 16 22.21 16 20Z" fill="white"/>
  </svg>
);

// Rabby Wallet Official Logo
export const RabbyIcon: React.FC<IconProps> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 40 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="40" height="40" rx="8" fill="#408CFF"/>
    <path d="M20 12L28 20H24V28H16V20H12L20 12ZM30 22V30H10V22H30Z" fill="white"/>
  </svg>
);

// Kepler Wallet Official Logo (simplified version - using indigo/purple color scheme)
export const KeplerIcon: React.FC<IconProps> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 40 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="40" height="40" rx="8" fill="#6366F1"/>
    <circle cx="20" cy="20" r="8" fill="none" stroke="white" strokeWidth="2"/>
    <circle cx="20" cy="20" r="3" fill="white"/>
  </svg>
);
