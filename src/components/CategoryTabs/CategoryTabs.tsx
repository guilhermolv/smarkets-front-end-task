import { categories } from '../../constants/categories';
import './CategoryTabs.scss';

type CategoryTabsProps = {
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
};

export function CategoryTabs({ selectedCategory, onSelectCategory }: CategoryTabsProps) {
  return (
    <div className="category-tabs" aria-label="Event category">
      {categories.map((category) => (
        <button
          className={category.id === selectedCategory ? 'category-tab category-tab-active' : 'category-tab'}
          key={category.id}
          type="button"
          onClick={() => onSelectCategory(category.id)}
        >
          {category.label}
        </button>
      ))}
    </div>
  );
}
