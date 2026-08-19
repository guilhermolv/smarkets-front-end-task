import { categories } from '../../constants/categories';
import './CategoryTabs.scss';

type CategoryTabsProps = {
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
};

export function CategoryTabs({ selectedCategory, onSelectCategory }: CategoryTabsProps) {
  return (
    <div className="category-tabs" role="tablist" aria-label="Event category">
      {categories.map((category) => {
        const isSelected = category.id === selectedCategory;

        return (
          <button
            aria-selected={isSelected}
            className={isSelected ? 'category-tab category-tab-active' : 'category-tab'}
            key={category.id}
            role="tab"
            type="button"
            onClick={() => onSelectCategory(category.id)}
          >
            {category.label}
          </button>
        );
      })}
    </div>
  );
}
