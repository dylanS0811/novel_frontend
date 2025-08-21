import React from "react";

// 性向静态配色（取代炫彩闪烁）
const ORI_COLOR = {
  "BL主受": { bg: "#FFE6EC", text: "#BE123C", border: "#FFD3DD" },
  "BL主攻": { bg: "#E6F4FF", text: "#1D4ED8", border: "#D6EDFF" },
  "言情": { bg: "#FFF2E6", text: "#C2410C", border: "#FFE3CC" },
  "男主无CP": { bg: "#EAFBEF", text: "#047857", border: "#D9F7E4" },
  "女主无CP": { bg: "#FFF0F5", text: "#DB2777", border: "#FFE1EC" },
  "男频": { bg: "#ECF3FF", text: "#2563EB", border: "#DDE9FF" },
  "女频": { bg: "#F5F3FF", text: "#7C3AED", border: "#EDE9FE" },
  "其他": { bg: "#F3F4F6", text: "#374151", border: "#E5E7EB" },
};

export default function OriChip({ value }) {
  const c = ORI_COLOR[value] || ORI_COLOR["其他"];
  return (
    <span className="inline-flex items-center text-[12px] px-2 py-0.5 rounded-full border" style={{ background: c.bg, color: c.text, borderColor: c.border }}>
      {value}
    </span>
  );
}
