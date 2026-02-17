import { Globe, FileCheck, Shield, CheckCircle } from "lucide-react";

export function FeaturesSection() {
  const features = [
    {
      icon: <Globe className="w-8 h-8 text-primary" />,
      title: "Non-Resident Specialists",
      description: "Expert guidance for US and international companies selling into Canada. We handle the simplified regime complexities."
    },
    {
      icon: <FileCheck className="w-8 h-8 text-primary" />,
      title: "Professional Filing",
      description: "Accurate, thorough registration submissions directly to the CRA. We handle the complexity so you don't have to."
    },
    {
      icon: <Shield className="w-8 h-8 text-primary" />,
      title: "CRA Authorized Reps",
      description: "Officially authorized to represent your business with the Canada Revenue Agency. Secure and compliant."
    },
    {
      icon: <CheckCircle className="w-8 h-8 text-primary" />,
      title: "CARM Ready",
      description: "Full support for the new CRA Assessment and Revenue Management (CARM) portal registration."
    }
  ];

  return (
    <section id="services" className="py-12 md:py-20 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-2xl mx-auto mb-8 md:mb-16">
          <h2 className="text-2xl md:text-3xl font-bold font-display mb-3 md:mb-4">Why Businesses Trust Us</h2>
          <p className="text-base md:text-lg text-slate-600">
            Navigating Canadian tax laws shouldn't be a burden. We simplify compliance so you can focus on growth.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-8">
          {features.map((feature, i) => (
            <div key={i} className="group flex items-start gap-3 p-4 md:block md:p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300" data-testid={`feature-card-${i}`}>
              <div className="shrink-0 bg-white w-10 h-10 md:w-14 md:h-14 md:mb-4 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
                {feature.icon}
              </div>
              <div>
                <h3 className="text-base md:text-xl font-semibold mb-1 md:mb-2">{feature.title}</h3>
                <p className="text-slate-600 text-xs md:text-sm leading-relaxed">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
