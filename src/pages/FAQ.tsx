import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import Navbar from '@/components/Navbar';
import { supabase } from '@/integrations/supabase/client';
import { 
  HelpCircle, 
  Mail, 
  MessageCircle, 
  Phone, 
  ExternalLink,
  CreditCard,
  ShoppingCart,
  Users,
  Shield,
  Clock,
  CheckCircle
} from 'lucide-react';

interface SiteSettings {
  support_email: string;
  support_telegram: string;
  support_phone: string;
}

const FAQ = () => {
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    fetchSiteSettings();
  }, []);

  const fetchSiteSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('support_email, support_telegram, support_phone')
        .eq('id', 1)
        .single();

      if (error) throw error;
      setSiteSettings(data);
    } catch (error) {
      console.error('Failed to fetch site settings:', error);
    }
  };

  const faqCategories = [
    {
      title: "Account & Credits",
      icon: CreditCard,
      color: "text-blue-600",
      questions: [
        {
          q: "How do I purchase credits?",
          a: "You can purchase credits by clicking the 'Buy Credits' button on your dashboard. Choose your amount, select K Pay or Wave Pay as payment method, complete the payment, and upload your payment proof. Credits will be added after admin approval within 2-4 hours."
        },
        {
          q: "What payment methods do you accept?",
          a: "We currently accept payments via K Pay and Wave Pay mobile wallets. Both methods require you to transfer the amount to our designated accounts and upload payment proof for verification."
        },
        {
          q: "How long does it take to get credits after payment?",
          a: "Credit approval typically takes 2-4 hours during business hours. Our admin team manually verifies each payment proof before adding credits to your account."
        },
        {
          q: "Can I get a refund for unused credits?",
          a: "Credits are generally non-refundable once purchased. However, if you have special circumstances, please contact our support team for assistance."
        }
      ]
    },
    {
      title: "Products & Orders",
      icon: ShoppingCart,
      color: "text-green-600",
      questions: [
        {
          q: "What telecom products are available?",
          a: "We offer a wide range of telecom products including data plans, voice plans, SMS packages, and beautiful numbers for all major Myanmar operators: MPT, Atom, Ooredoo, and Mytel."
        },
        {
          q: "How do I purchase a product?",
          a: "Browse products on the main page, click on the product you want, enter your phone number, and confirm the purchase. Credits will be deducted from your balance and the product will be activated."
        },
        {
          q: "Can I cancel an order after placing it?",
          a: "Orders cannot be cancelled once placed as most telecom products are activated immediately. Please double-check your order details before confirming."
        },
        {
          q: "What if my product activation fails?",
          a: "If your product doesn't activate properly, please contact our support team immediately with your order details. We'll investigate and either retry the activation or refund your credits."
        }
      ]
    },
    {
      title: "Account Management",
      icon: Users,
      color: "text-purple-600",
      questions: [
        {
          q: "How do I create an account?",
          a: "Click the 'Sign In' button and choose to sign up with your email. You'll receive a verification email to complete the registration process."
        },
        {
          q: "I forgot my password. How can I reset it?",
          a: "On the sign-in page, click 'Forgot Password' and enter your email. You'll receive a password reset link to create a new password."
        },
        {
          q: "Can I change my email address?",
          a: "Currently, email addresses cannot be changed directly. Please contact our support team if you need to update your account email."
        },
        {
          q: "How do I update my profile information?",
          a: "Go to your profile page from the dashboard to update your name and other account details."
        }
      ]
    },
    {
      title: "Security & Privacy",
      icon: Shield,
      color: "text-red-600",
      questions: [
        {
          q: "Is my payment information secure?",
          a: "Yes, we use secure payment processing and don't store sensitive payment information. All transactions are encrypted and processed through trusted payment gateways."
        },
        {
          q: "How is my personal data protected?",
          a: "We follow strict data protection practices and only collect necessary information. Your data is encrypted and never shared with third parties without your consent."
        },
        {
          q: "What if I suspect unauthorized access to my account?",
          a: "Immediately change your password and contact our support team. We'll help secure your account and investigate any suspicious activity."
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <HelpCircle className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Frequently Asked Questions</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Find answers to common questions about our telecom services, payments, and account management.
            Can't find what you're looking for? Contact our support team.
          </p>
        </div>

        {/* Support Contact Cards */}
        {siteSettings && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="border-blue-200 bg-blue-50/50">
              <CardContent className="p-4 text-center">
                <Mail className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <h3 className="font-semibold mb-1">Email Support</h3>
                <p className="text-sm text-muted-foreground mb-3">Get help via email</p>
                <Button variant="outline" size="sm" asChild>
                  <a href={`mailto:${siteSettings.support_email}`}>
                    {siteSettings.support_email}
                  </a>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-green-50/50">
              <CardContent className="p-4 text-center">
                <MessageCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <h3 className="font-semibold mb-1">Live Chat</h3>
                <p className="text-sm text-muted-foreground mb-3">Chat with us on Telegram</p>
                <Button variant="outline" size="sm" asChild>
                  <a href={siteSettings.support_telegram} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Telegram
                  </a>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-orange-200 bg-orange-50/50">
              <CardContent className="p-4 text-center">
                <Phone className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                <h3 className="font-semibold mb-1">Phone Support</h3>
                <p className="text-sm text-muted-foreground mb-3">Call us directly</p>
                <Button variant="outline" size="sm" asChild>
                  <a href={`tel:${siteSettings.support_phone}`}>
                    {siteSettings.support_phone}
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* FAQ Categories */}
        <div className="space-y-8">
          {faqCategories.map((category, categoryIndex) => {
            const Icon = category.icon;
            return (
              <Card key={categoryIndex}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Icon className={`h-6 w-6 ${category.color}`} />
                    {category.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {category.questions.map((faq, faqIndex) => (
                      <div key={faqIndex}>
                        <h3 className="font-semibold text-lg mb-2 flex items-start gap-2">
                          <Badge variant="outline" className="mt-1 min-w-fit">
                            Q{faqIndex + 1}
                          </Badge>
                          {faq.q}
                        </h3>
                        <div className="ml-12">
                          <p className="text-muted-foreground leading-relaxed">
                            {faq.a}
                          </p>
                        </div>
                        {faqIndex < category.questions.length - 1 && (
                          <Separator className="mt-4" />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Additional Help */}
        <Card className="mt-8 border-primary/20 bg-primary/5">
          <CardContent className="p-6 text-center">
            <HelpCircle className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Still Need Help?</h3>
            <p className="text-muted-foreground mb-4">
              Our support team is here to help you with any questions or issues you might have.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {siteSettings && (
                <>
                  <Button asChild>
                    <a href={`mailto:${siteSettings.support_email}`}>
                      <Mail className="h-4 w-4 mr-2" />
                      Email Support
                    </a>
                  </Button>
                  <Button variant="outline" asChild>
                    <a href={siteSettings.support_telegram} target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Live Chat
                    </a>
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Business Hours */}
        <Card className="mt-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Support Hours: 9:00 AM - 6:00 PM (Myanmar Time)</span>
              </div>
              <Separator orientation="vertical" className="h-4" />
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Average Response Time: 2-4 hours</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FAQ;