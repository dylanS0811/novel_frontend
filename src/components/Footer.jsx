import React from 'react';

export default function Footer() {
  return (
    <div className="text-center text-xs text-gray-500 py-10">
      © {new Date().getFullYear()} 个人制作。保留所有权利。
    </div>
  );
}
