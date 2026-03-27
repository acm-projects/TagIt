import { useEffect, useState } from "react";

export type UserCategory = {
  id: string;
  name: string;
  color: string; // hex code provided by backend
  isCustom: boolean;
};

export const DEFAULT_CATEGORY_COLOR = "#E5E7EB";

const STORAGE_KEY = "tagit.user-categories.v1";
const CATEGORIES_UPDATED_EVENT = "tagit:categories-updated";

// Temporary mock to mimic backend-provided user categories until API wiring lands.
const DEFAULT_USER_CATEGORIES: UserCategory[] = [
  { id: "urgent", name: "Urgent", color: "#FEE2E2", isCustom: false },
  { id: "work", name: "Work", color: "#DBEAFE", isCustom: false },
  { id: "school", name: "School", color: "#E0F2FE", isCustom: false },
  { id: "personal", name: "Personal", color: "#FCE7F3", isCustom: false },
  { id: "side-hustle", name: "Side Hustle", color: "#EDE9FE", isCustom: true },
];

const BUILT_IN_CATEGORY_IDS = new Set(
  DEFAULT_USER_CATEGORIES.filter((category) => !category.isCustom).map((category) => category.id),
);

const cloneCategories = (categories: UserCategory[]): UserCategory[] =>
  categories.map((category) => ({ ...category }));

const normalizeCategories = (categories: UserCategory[]): UserCategory[] => {
  const incomingById = new Map(categories.map((category) => [category.id, category]));
  const normalizedDefaults = DEFAULT_USER_CATEGORIES.map((defaultCategory) => {
    const incomingCategory = incomingById.get(defaultCategory.id);
    if (!incomingCategory) {
      return { ...defaultCategory };
    }

    if (defaultCategory.isCustom) {
      return { ...incomingCategory };
    }

    return {
      ...incomingCategory,
      name: defaultCategory.name,
      color: defaultCategory.color,
      isCustom: false,
    };
  });

  const customCategories = categories
    .filter((category) => !BUILT_IN_CATEGORY_IDS.has(category.id))
    .map((category) => ({ ...category }));

  return [...normalizedDefaults, ...customCategories];
};

const dispatchCategoriesUpdated = () => {
  window.dispatchEvent(new Event(CATEGORIES_UPDATED_EVENT));
};

const readStoredCategories = (): UserCategory[] | null => {
  if (typeof window === "undefined") return cloneCategories(DEFAULT_USER_CATEGORIES);

  const storedValue = window.localStorage.getItem(STORAGE_KEY);
  if (!storedValue) return null;

  try {
    const parsed = JSON.parse(storedValue);
    if (!Array.isArray(parsed)) return null;

    return parsed
      .filter(
        (item): item is UserCategory =>
          item &&
          typeof item.id === "string" &&
          typeof item.name === "string" &&
          typeof item.color === "string" &&
          typeof item.isCustom === "boolean",
      )
      .map((category) => ({ ...category }));
  } catch {
    return null;
  }
};

const writeStoredCategories = (categories: UserCategory[]) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeCategories(categories)));
  dispatchCategoriesUpdated();
};

export const getDefaultUserCategories = (): UserCategory[] =>
  cloneCategories(DEFAULT_USER_CATEGORIES);

/**
 * Acts like a backend fetch today. Replace the caller with a real API response later,
 * then pass that response into `setUserCategories` so every page updates consistently.
 */
export const getUserCategories = async (): Promise<UserCategory[]> => {
  return normalizeCategories(readStoredCategories() ?? getDefaultUserCategories());
};

export const setUserCategories = (categories: UserCategory[]): void => {
  writeStoredCategories(cloneCategories(categories));
};

export const syncUserCategoriesFromBackend = async (
  categoriesFromBackend: UserCategory[],
): Promise<UserCategory[]> => {
  const nextCategories = cloneCategories(categoriesFromBackend);
  setUserCategories(nextCategories);
  return nextCategories;
};

export const subscribeToCategoryUpdates = (listener: () => void): (() => void) => {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleUpdate = () => {
    listener();
  };

  window.addEventListener(CATEGORIES_UPDATED_EVENT, handleUpdate);
  window.addEventListener("storage", handleUpdate);

  return () => {
    window.removeEventListener(CATEGORIES_UPDATED_EVENT, handleUpdate);
    window.removeEventListener("storage", handleUpdate);
  };
};

export const useUserCategories = (): UserCategory[] => {
  const [categories, setCategories] = useState<UserCategory[]>(() => getDefaultUserCategories());

  useEffect(() => {
    let isMounted = true;

    const refreshCategories = async () => {
      const nextCategories = await getUserCategories();
      if (isMounted) {
        setCategories(nextCategories);
      }
    };

    void refreshCategories();
    return subscribeToCategoryUpdates(() => {
      void refreshCategories();
    });
  }, []);

  return categories;
};

export const getCategoryById = (
  categories: UserCategory[],
  categoryId?: string,
): UserCategory | undefined => {
  if (!categoryId) return undefined;
  return categories.find((category) => category.id === categoryId);
};

export const getCategoryColorById = (
  categories: UserCategory[],
  categoryId?: string,
): string => {
  return getCategoryById(categories, categoryId)?.color ?? DEFAULT_CATEGORY_COLOR;
};
