import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { type Product } from "@/lib/products";
import { ShoppingCart } from "lucide-react";


interface ProductCardProps {
  product: Product;
  isSelected?: boolean;
  onSelect?: (product: Product) => void;
  onPurchase?: (product: Product) => void;
}

const ProductCard = ({ product, isSelected = false, onSelect, onPurchase }: ProductCardProps) => {
  const operatorColors = {
    MPT: "bg-blue-600",
    OOREDOO: "bg-red-600",
    ATOM: "bg-green-600",
    MYTEL: "bg-purple-600"
  };

  const handlePurchase = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onPurchase) {
      onPurchase(product);
    } else {
      // Fallback: scroll to premium products section
      const premiumSection = document.getElementById('premium-products');
      if (premiumSection) {
        premiumSection.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    }
  };

  return (
    <div
      className={`
        product-card rounded-2xl p-6 cursor-pointer group
        ${isSelected ? 'selected' : ''}
      `}
      onClick={() => onSelect?.(product)}>

      {/* Header with operator badge */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`w-4 h-4 rounded-full ${operatorColors[product.operator]} shadow-lg`} />
          <span className="text-white/80 font-semibold text-sm tracking-wide">
            {product.operator}
          </span>
        </div>
        <span className="text-xs text-white/60 bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm">
          {product.category}
        </span>
      </div>
      
      {/* Product details */}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-white mb-2 font-space-grotesk">
          {product.name}
        </h3>
        <p className="text-white/70 text-sm leading-relaxed">
          {product.description}
        </p>
      </div>
      
      {/* Price and action */}
      <div className="flex items-center justify-between">
        <div className="flex items-baseline space-x-2">
          <span className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
            {typeof product.price === 'number' ? product.price.toLocaleString() : '0'}
          </span>
          <span className="text-white/60 text-sm font-medium">
            {product.currency}
          </span>
        </div>
        
        <Button
          className="btn-premium px-6 py-3 rounded-xl font-semibold group-hover:shadow-md transition-all"
          onClick={handlePurchase}>

          <ShoppingCart className="mr-2 h-4 w-4" />
          Purchase
        </Button>
      </div>
    </div>);

};

export default ProductCard;