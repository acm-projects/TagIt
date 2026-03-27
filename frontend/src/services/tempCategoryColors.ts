// TEMP: remove after backend integration. Hardcoded pastel category colors for visual verification.
export const TEMP_CATEGORY_COLORS: Record<string, string> = {
  urgent: "#FECACA", // light red
  work: "#BBF7D0", // light green
  school: "#BFDBFE", // light blue
  personal: "#FDE68A", // light amber
  "side-hustle": "#E9D5FF", // light purple
  default: "#E5E7EB", // light gray fallback
};

export const getTempCategoryColor = (categoryId?: string): string => {
  if (!categoryId) return TEMP_CATEGORY_COLORS.default;
  return TEMP_CATEGORY_COLORS[categoryId] ?? TEMP_CATEGORY_COLORS.default;
};
