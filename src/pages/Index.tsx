import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import HeroBanner from "@/components/HeroBanner";
import ProductListing from "@/components/ProductListing";

const Index = () => {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const scrollTo = searchParams.get('scrollTo');
    const operator = searchParams.get('operator');
    
    if (scrollTo === 'products') {
      // Wait for both component render and any filter application
      setTimeout(() => {
        const productsGrid = document.getElementById('products-grid');
        const productsSection = document.getElementById('products-section');
        const targetElement = productsGrid || productsSection;
        
        if (targetElement) {
          targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      }, 300); // Increased delay to ensure filters are applied
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroBanner />
      <div id="products-section">
        <ProductListing />
      </div>
    </div>
  );
};

export default Index;