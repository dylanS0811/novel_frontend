// src/components/icons/BookHamsterIcon.jsx
import React from 'react';
import logo from '../../image/logo.jpg';

const src = logo;

export default function BookHamsterIcon({
  size = 48,
  className = '',
  radius = 12 // 图片圆角
}) {
  return (
    <img
      src={src}
      alt="Logo"
      width={size}
      height={size}
      className={className}
      style={{
        display: 'block',
        width: size,
        height: size,
        objectFit: 'cover',
        borderRadius: radius, // 圆角
        background: 'transparent' // ✅ 背景透明
      }}
    />
  );
}
