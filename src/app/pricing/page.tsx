import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { LanguageProvider } from '@/contexts/LanguageContext';

export default function PricingPage() {
  return (
    <LanguageProvider>
      <Header />

      {/* HERO */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-display text-4xl md:text-5xl text-brand-navy mb-6">
            Simple, transparent <span className="text-brand-teal">pricing</span>
          </h1>
          <p className="text-lg text-slate-700 max-w-3xl mx-auto mb-12">
            Choose the plan that's right for your events. Start free, upgrade anytime.
          </p>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                title: "Free Trial",
                price: "$0",
                period: "7 days",
                features: ["Up to 3 teams", "5 stations max", "Basic tracking", "Email support"],
                cta: "Start Free Trial",
                popular: false
              },
              {
                title: "Party Pass",
                price: "$29",
                period: "per event",
                features: ["Up to 8 teams", "20 stations max", "Real-time tracking", "Phone support", "Custom branding"],
                cta: "Choose Party Pass",
                popular: true
              },
              {
                title: "Pro",
                price: "$99",
                period: "per month",
                features: ["Unlimited teams", "Unlimited stations", "Advanced analytics", "Priority support", "White-label"],
                cta: "Go Pro",
                popular: false
              }
            ].map((plan) => (
              <div key={plan.title} className={`rounded-xl2 bg-white shadow-card p-8 ${plan.popular ? 'ring-2 ring-brand-teal' : ''}`}>
                {plan.popular && <div className="bg-brand-teal text-white px-3 py-1 rounded-full text-sm font-medium mb-4 inline-block">Most Popular</div>}
                <h3 className="font-display text-2xl text-brand-navy mb-2">{plan.title}</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-brand-navy">{plan.price}</span>
                  <span className="text-slate-600">/{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center text-slate-600">
                      <span className="text-brand-teal mr-3">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <a href="/auth/signup" className={`block w-full text-center py-3 px-6 rounded-lg font-medium ${plan.popular ? 'bg-brand-navy text-white hover:opacity-90' : 'bg-slate-100 text-brand-navy hover:bg-slate-200'}`}>
                  {plan.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </LanguageProvider>
  );
}