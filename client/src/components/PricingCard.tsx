import { Check, ArrowRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PricingFeature {
  text: string;
  included: boolean;
}

interface PricingCardProps {
  title: string;
  price: string;
  description: string;
  features: PricingFeature[];
  isPopular?: boolean;
  isFeatured?: boolean;
  onSelect: () => void;
  type: string;
}

export function PricingCard({ 
  title, 
  price, 
  description, 
  features, 
  isPopular,
  isFeatured,
  onSelect,
  type
}: PricingCardProps) {
  return (
    <div className={`relative h-full ${isPopular ? 'transform md:-translate-y-4' : ''} ${isFeatured ? 'transform md:-translate-y-6' : ''}`} data-testid={`pricing-card-${type}`}>
      {isPopular && (
        <div className="absolute -top-4 left-0 right-0 flex justify-center z-10">
          <Badge className="bg-primary hover:bg-primary px-4 py-1 text-sm shadow-lg shadow-primary/30">
            Most Popular
          </Badge>
        </div>
      )}
      {isFeatured && (
        <div className="absolute -top-4 left-0 right-0 flex justify-center z-10">
          <Badge className="bg-amber-500 hover:bg-amber-500 px-4 py-1 text-sm shadow-lg shadow-amber-500/30">
            <Star className="w-3 h-3 mr-1 fill-current" /> Best Value
          </Badge>
        </div>
      )}
      
      <Card className={`h-full flex flex-col border transition-all duration-300 hover:shadow-xl ${
        isFeatured
          ? 'border-amber-400 shadow-lg shadow-amber-500/10 bg-gradient-to-b from-amber-50/50 to-white ring-1 ring-amber-200'
          : isPopular 
            ? 'border-primary shadow-lg shadow-primary/10 bg-white' 
            : 'border-border/50 bg-white/50 hover:border-primary/50'
      }`}>
        <CardHeader>
          <CardTitle className="text-xl font-bold">{title}</CardTitle>
          <CardDescription className="text-sm mt-2 min-h-[40px]">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1">
          <div className="mb-6">
            <span className="text-4xl font-bold text-slate-900">{price}</span>
            <span className="text-muted-foreground ml-2">/ one-time</span>
          </div>
          
          <ul className="space-y-3">
            {features.map((feature, i) => (
              <li key={i} className="flex items-start">
                <div className={`mr-3 mt-1 rounded-full p-0.5 ${feature.included ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                  <Check className="w-3 h-3" />
                </div>
                <span className={`text-sm ${feature.included ? 'text-slate-700' : 'text-slate-400 line-through'}`}>
                  {feature.text}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={onSelect}
            className={`w-full group cursor-pointer transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-xl active:scale-100 ${
              isFeatured 
                ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/25' 
                : isPopular 
                  ? 'bg-primary hover:bg-[#0056b3] shadow-lg shadow-primary/25' 
                  : 'bg-slate-900 hover:bg-slate-800 shadow-lg shadow-slate-900/25'
            }`}
            data-testid={`button-get-started-${type}`}
          >
            Get Started
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
