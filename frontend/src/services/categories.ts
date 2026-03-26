export type UserCategory = {
  id: string;
  name: string;
  color: string; // hex code provided by backend
  isCustom: boolean;
};

// Temporary mock to mimic backend-provided user categories.
const MOCK_USER_CATEGORIES: UserCategory[] = [
  { id: "urgent", name: "Urgent", color: "#FEE2E2", isCustom: false },
  { id: "work", name: "Work", color: "#DBEAFE", isCustom: false },
  { id: "school", name: "School", color: "#E0F2FE", isCustom: false },
  { id: "personal", name: "Personal", color: "#FCE7F3", isCustom: false },
  // Example custom category created by the user during setup.
  { id: "side-hustle", name: "Side Hustle", color: "#EDE9FE", isCustom: true },
];

/**
 * Acts like a backend fetch. Swap this implementation with an API call or global store later.
 */
export const getUserCategories = async (): Promise<UserCategory[]> => {
  return MOCK_USER_CATEGORIES;
};
