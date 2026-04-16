import { useEffect, useState } from "react";
import { getCurrentUsername } from "./currentUser";
import {
  getCategoryIdForPriority,
  loadUserPriorities,
  subscribeToPriorityUpdates,
  type PriorityRule,
} from "./priorities";

export type UserCategory = {
  id: string;
  name: string;
  color: string;
  isCustom: boolean;
};

export const DEFAULT_CATEGORY_COLOR = "#E5E7EB";

const getCategoriesKey = () => `tagit.user-categories.v1.${getCurrentUsername()}`;
const CATEGORIES_UPDATED_EVENT = "tagit:categories-updated";
const DEFAULT_CATEGORY_PALETTE = ["#FEE2E2", "#DBEAFE", "#E0F2FE", "#FCE7F3", "#EDE9FE"];

const cloneCategories = (categories: UserCategory[]): UserCategory[] =>
  categories.map((category) => ({ ...category }));

const createDefaultCategoriesFromPriorities = (
  priorities: PriorityRule[],
): UserCategory[] =>
  priorities.map((priority, index) => ({
    id: getCategoryIdForPriority(priority.id),
    name: priority.label,
    color: DEFAULT_CATEGORY_PALETTE[index % DEFAULT_CATEGORY_PALETTE.length],
    isCustom: false,
  }));

const isUserCategoryArray = (value: unknown): value is UserCategory[] => {
  if (!Array.isArray(value)) return false;

  return value.every((entry) => {
    if (!entry || typeof entry !== "object") return false;

    const candidate = entry as Partial<UserCategory>;
    return (
      typeof candidate.id === "string" &&
      typeof candidate.name === "string" &&
      typeof candidate.color === "string" &&
      typeof candidate.isCustom === "boolean"
    );
  });
};

const readStoredCategories = (): UserCategory[] | null => {
  try {
    const raw = localStorage.getItem(getCategoriesKey());
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);
    if (!isUserCategoryArray(parsed)) return null;

    return cloneCategories(parsed);
  } catch {
    return null;
  }
};

const mergeCategoriesWithPriorities = (
  priorities: PriorityRule[],
  storedCategories: UserCategory[] | null,
): UserCategory[] => {
  const storedById = new Map((storedCategories ?? []).map((category) => [category.id, category]));

  return createDefaultCategoriesFromPriorities(priorities).map((category) => {
    const storedCategory = storedById.get(category.id);
    if (!storedCategory) {
      return category;
    }

    return {
      ...category,
      color: storedCategory.color || category.color,
    };
  });
};

const dispatchCategoriesUpdated = () => {
  window.dispatchEvent(new Event(CATEGORIES_UPDATED_EVENT));
};

const writeStoredCategories = (categories: UserCategory[]) => {
  try {
    localStorage.setItem(getCategoriesKey(), JSON.stringify(categories));
    dispatchCategoriesUpdated();
  } catch {
    // Ignore storage errors so the UI remains usable.
  }
};

export const getDefaultUserCategories = (): UserCategory[] =>
  createDefaultCategoriesFromPriorities(loadUserPriorities());

export const getUserCategories = async (): Promise<UserCategory[]> => {
  return mergeCategoriesWithPriorities(loadUserPriorities(), readStoredCategories());
};

export const setUserCategories = (categories: UserCategory[]): void => {
  writeStoredCategories(cloneCategories(categories));
};

export const setUserCategoryColor = (categoryId: string, color: string): void => {
  const nextCategories = mergeCategoriesWithPriorities(loadUserPriorities(), readStoredCategories()).map(
    (category) =>
      category.id === categoryId
        ? {
            ...category,
            color,
          }
        : category,
  );

  setUserCategories(nextCategories);
};

export const syncUserCategoriesFromBackend = async (
  categoriesFromBackend: UserCategory[],
): Promise<UserCategory[]> => {
  const currentCategories = await getUserCategories();
  const backendById = new Map(categoriesFromBackend.map((category) => [category.id, category]));

  const nextCategories = currentCategories.map((category) => {
    const backendCategory = backendById.get(category.id);
    if (!backendCategory) {
      return category;
    }

    return {
      ...category,
      color: backendCategory.color,
    };
  });

  setUserCategories(nextCategories);
  return nextCategories;
};

export const subscribeToCategoryUpdates = (listener: () => void): (() => void) => {
  const storageListener = (event: StorageEvent) => {
    if (event.key === getCategoriesKey() || event.key === null) {
      listener();
    }
  };

  window.addEventListener(CATEGORIES_UPDATED_EVENT, listener);
  window.addEventListener("storage", storageListener);

  return () => {
    window.removeEventListener(CATEGORIES_UPDATED_EVENT, listener);
    window.removeEventListener("storage", storageListener);
  };
};

export const useUserCategories = (): UserCategory[] => {
  const [categories, setCategories] = useState<UserCategory[]>(() => getDefaultUserCategories());

  useEffect(() => {
    const refreshCategories = async () => {
      setCategories(await getUserCategories());
    };

    void refreshCategories();

    const unsubscribeCategories = subscribeToCategoryUpdates(() => {
      void refreshCategories();
    });
    const unsubscribePriorities = subscribeToPriorityUpdates(() => {
      void refreshCategories();
    });

    return () => {
      unsubscribeCategories();
      unsubscribePriorities();
    };
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
