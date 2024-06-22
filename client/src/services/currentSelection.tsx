import React, { createContext, useContext, useState, ReactNode } from 'react';

interface CurrentSelectionContextType {
  selectedMonth: string | null;
  onMonthSelect: (month: string) => void;
  selectedCategory: string | null;
  onCategorySelect: (category: string) => void;
  selectedSubCategory: string | null;
  onSubCategorySelect: (subCategory: string) => void;
}

const CurrentSelectionContext = createContext<
  CurrentSelectionContextType | undefined
>(undefined);

export const useCurrentSelection = () => {
  const context = useContext(CurrentSelectionContext);
  if (context === undefined) {
    throw new Error(
      'useCurrentSelection must be used within a CurrentSelectionProvider'
    );
  }
  return context;
};

interface CurrentSelectionProviderProps {
  children: ReactNode;
}

export const CurrentSelectionProvider: React.FC<
  CurrentSelectionProviderProps
> = ({ children }) => {
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);

  const onMonthClick = (month: string) => {
    setSelectedMonth(month);
  };

  const onCategorySelect = (category: string) => {
    setSelectedCategory(category);
  };

  const onSubCategorySelect = (subCategory: string) => {
    setSelectedSubCategory(subCategory);
  };

  return (
    <CurrentSelectionContext.Provider
      value={{
        selectedMonth,
        onMonthSelect: onMonthClick,
        selectedCategory,
        onCategorySelect,
        selectedSubCategory,
        onSubCategorySelect,
      }}
    >
      {children}
    </CurrentSelectionContext.Provider>
  );
};
