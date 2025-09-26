import { CardHover } from "@/components/ui/Card";

const tiers = [
  {
    name: "Party Pass",
    price: "₪149",
    features: ["עד 5 צוותים", "10 תחנות", "תמיכת אימייל"],
    cta: { label: "בחר", href: "/checkout?plan=party" },
    popular: true,
  },
  {
    name: "School Day",
    price: "₪349",
    features: ["עד 10 צוותים", "20 תחנות", "דוחות בסיסיים"],
    cta: { label: "בחר", href: "/checkout?plan=school" },
  },
  {
    name: "Pro Organizer",
    price: "₪899",
    features: ["ללא הגבלה", "מותג לבן", "תמיכה מועדפת"],
    cta: { label: "בחר", href: "/checkout?plan=pro" },
  },
];

export default function Pricing() {
  return (
    <section className="py-16 md:py-24" id="pricing">
      <div className="mx-auto max-w-screen-2xl px-4 md:px-6">
        <h2 className="text-3xl font-semibold">מחירון</h2>
        <p className="mt-2 text-slate-600">בחרו תוכנית שמתאימה לאירוע שלכם.</p>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {tiers.map((t) => (
            <CardHover key={t.name} className={`relative ${t.popular ? "bg-blue-50" : ""}`}>
              {t.popular ? (
                <span className="absolute -top-3 inline-flex rounded-full bg-blue-500 px-3 py-1 text-xs font-semibold text-white">
                  הכי פופולרי
                </span>
              ) : null}
              <h3 className="text-xl font-semibold">{t.name}</h3>
              <div className="mt-4 text-3xl font-semibold">{t.price}</div>
              <ul className="mt-4 space-y-2 text-slate-700">
                {t.features.map((f) => (
                  <li key={f}>• {f}</li>
                ))}
              </ul>
              <a
                href={t.cta.href}
                className="mt-6 inline-flex rounded-2xl bg-blue-500 px-5 py-3 font-semibold text-white hover:bg-brand-600"
              >
                {t.cta.label}
              </a>
            </CardHover>
          ))}
        </div>
      </div>
    </section>
  );
}
