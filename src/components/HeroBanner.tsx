import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Zap, CreditCard } from "lucide-react";

const HeroBanner = () => {
  const navigate = useNavigate();

  const handleBuyNow = () => {
    const premiumSection = document.getElementById('premium-products');
    if (premiumSection) {
      premiumSection.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  const handleBuyCreditClick = () => {
    navigate('/premium');
  };

  return (
    <section className="relative min-h-[85vh] md:min-h-[90vh] flex items-center justify-center overflow-hidden mesh-gradient py-12 md:py-16">
      {/* Floating gradient orbs */}
      <div className="floating-orb"></div>
      <div className="floating-orb"></div>
      <div className="floating-orb"></div>
      
      <div className="container mx-auto px-4 text-center relative z-10">
        {/* Main Title */}
        <div className="mb-8 md:mb-10">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-bold text-white mb-3 md:mb-4 font-space-grotesk leading-tight">
            Discover Operator
            <br />
            <span className="bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400 bg-clip-text text-transparent">
              Products
            </span>
          </h1>
        </div>

        {/* Premium description card */}
        <div className="relative mx-auto max-w-2xl mb-10 md:mb-14">
          <div className="glass-card rounded-2xl md:rounded-3xl p-6 md:p-8">
            <div className="flex items-center justify-center mb-4 md:mb-5">
              <Zap className="h-6 w-6 md:h-8 md:w-8 text-amber-400 mr-2 md:mr-3" />
              <span className="text-amber-400 font-semibold text-base md:text-lg">Premium Network</span>
            </div>
            <p className="text-base md:text-xl text-gray-200 leading-relaxed mb-2">
              All your favorite telecom products from MPT, Ooredoo, Atom, and MyTel in one place. 
              Instantly top-up data, minutes, and more.
            </p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-6">
          {/* Buy Credit Button */}
          <div className="relative">
            <Button
              size="lg"
              onClick={handleBuyCreditClick}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg md:text-xl px-8 md:px-12 py-6 md:py-8 rounded-xl md:rounded-2xl font-semibold group shadow-2xl">
              <CreditCard className="mr-2 md:mr-3 h-5 w-5 md:h-6 md:w-6" />
              Buy Credit
            </Button>
            
            {/* Feature badge */}
            <div className="absolute -top-2 -right-2 bg-amber-500 text-black text-xs px-2 py-1 rounded-full font-bold animate-pulse">
              100 MMK = 1 Credit
            </div>
          </div>

          {/* Browse Products Button */}
          <div className="relative">
            <Button
              size="lg"
              onClick={handleBuyNow}
              className="btn-premium text-lg md:text-xl px-8 md:px-12 py-6 md:py-8 rounded-xl md:rounded-2xl font-semibold group">
              Browse Products
              <ArrowRight className="ml-2 md:ml-3 h-5 w-5 md:h-6 md:w-6 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroBanner;