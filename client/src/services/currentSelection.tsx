import React, { createContext, useContext, useState, ReactNode } from 'react';

interface CurrentSelectionContextType {
  selectedMonth: string;
  onMonthSelect: (month: string) => void;
  selectedCostType: string;
  onCostTypeSelect: (costType: string) => void;
  selectedCategory: string;
  onCategorySelect: (category: string) => void;
  selectedSubCategory: string;
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
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedCostType, setSelectedCostType] = useState<string>(
    'SpendingType'
  );
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('');

  const onMonthSelect = (month: string) => {
    setSelectedMonth(month);
  };

  const onCostTypeSelect = (costType: string) => {
    setSelectedCostType(costType);
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
        onMonthSelect,
        selectedCostType,
        onCostTypeSelect,
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
