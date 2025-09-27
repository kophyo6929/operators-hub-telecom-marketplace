import { Button } from "@/components/ui/button";
import { operators, categories, type Operator, type Category } from "@/lib/products";

interface ProductFiltersProps {
  selectedOperator: string | null;
  selectedCategory: string | null;
  onOperatorChange: (operator: string | null) => void;
  onCategoryChange: (category: string | null) => void;
}

const ProductFilters = ({
  selectedOperator,
  selectedCategory,
  onOperatorChange,
  onCategoryChange
}: ProductFiltersProps) => {
  return (
    <div className="space-y-8 mb-12">
      {/* Operator Filters */}
      <div>
        <h3 className="text-xl font-semibold text-white mb-4 font-space-grotesk">Network Operator</h3>
        <div className="flex flex-wrap gap-4">
          <button
            className={`filter-btn ${selectedOperator === null ? 'active' : ''}`}
            onClick={() => onOperatorChange(null)}>

            All Networks
          </button>
          {operators.map((operator) =>
          <button
            key={operator}
            className={`filter-btn ${selectedOperator === operator ? 'active' : ''}`}
            onClick={() => onOperatorChange(operator)}>

              {operator}
            </button>
          )}
        </div>
      </div>

      {/* Category Filters */}
      <div>
        <h3 className="text-xl font-semibold text-white mb-4 font-space-grotesk">Product Category</h3>
        <div className="flex flex-wrap gap-4">
          <button
            className={`filter-btn ${selectedCategory === null ? 'active' : ''}`}
            onClick={() => onCategoryChange(null)}>

            All Categories
          </button>
          {categories.map((category) =>
          <button
            key={category}
            className={`filter-btn ${selectedCategory === category ? 'active' : ''}`}
            onClick={() => onCategoryChange(category)}>

              {category}
            </button>
          )}
        </div>
      </div>
    </div>);

};

export default ProductFilters;