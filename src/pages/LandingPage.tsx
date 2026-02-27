import { Link } from "react-router-dom";
import { useLang } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { ArrowLeftRight, RotateCw, Shield, Zap, Languages } from "lucide-react";

const LandingPage = () => {
  const { t, toggle, lang } = useLang();

  const features = [
    { icon: ArrowLeftRight, title: t("landing.mutual.title"), desc: t("landing.mutual.desc") },
    { icon: RotateCw, title: t("landing.cycle.title"), desc: t("landing.cycle.desc") },
    { icon: Zap, title: t("landing.auto.title"), desc: t("landing.auto.desc") },
    { icon: Shield, title: t("landing.track.title"), desc: t("landing.track.desc") },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-card">
        <div className="container flex items-center justify-between h-16">
          <span className="text-xl font-bold tracking-tight">
            <span className="text-secondary">{t("app.name.prefix")}</span>{t("app.name.suffix")}
          </span>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={toggle} className="gap-1">
              <Languages className="h-4 w-4" />
              {lang === "fr" ? "العربية" : "Français"}
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/login">{t("auth.login")}</Link>
            </Button>
            <Button asChild>
              <Link to="/signup">{t("auth.signup")}</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="flex-1 flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/10 py-20">
        <div className="container text-center max-w-2xl space-y-6">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
            {t("landing.hero.title")}
          </h1>
          <p className="text-lg text-muted-foreground">{t("landing.hero.subtitle")}</p>
          <div className="flex items-center justify-center gap-4">
            <Button size="lg" asChild>
              <Link to="/signup">{t("landing.cta.start")}</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/login">{t("landing.cta.login")}</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-16 bg-card">
        <div className="container">
          <h2 className="text-2xl font-bold text-center mb-10">{t("landing.how")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <div key={f.title} className="p-6 rounded-xl border bg-background space-y-3 text-center">
                <div className="mx-auto w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} {t("app.name.prefix")}{t("app.name.suffix")} — {t("landing.footer")}
      </footer>
    </div>
  );
};

export default LandingPage;
