import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeftRight, RotateCw, Shield, Zap } from "lucide-react";

const features = [
  {
    icon: ArrowLeftRight,
    title: "Mutation mutuelle",
    desc: "Échange direct entre deux fonctionnaires de provinces différentes.",
  },
  {
    icon: RotateCw,
    title: "Mutation cyclique",
    desc: "Rotation à trois : A→B, B→C, C→A détectée automatiquement.",
  },
  {
    icon: Zap,
    title: "Détection automatique",
    desc: "Le système trouve les correspondances dès qu'une demande est soumise.",
  },
  {
    icon: Shield,
    title: "Suivi transparent",
    desc: "Consultez le statut de vos demandes en temps réel.",
  },
];

const LandingPage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container flex items-center justify-between h-16">
          <span className="text-xl font-bold tracking-tight">
            <span className="text-secondary">Mouv</span>ement
          </span>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link to="/login">Se connecter</Link>
            </Button>
            <Button asChild>
              <Link to="/signup">S'inscrire</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/10 py-20">
        <div className="container text-center max-w-2xl space-y-6">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
            Gérez vos <span className="text-primary">mutations</span> en toute simplicité
          </h1>
          <p className="text-lg text-muted-foreground">
            Plateforme de gestion des mouvements du personnel. Soumettez vos demandes et laissez le système détecter automatiquement les mutations mutuelles et cycliques.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Button size="lg" asChild>
              <Link to="/signup">Commencer maintenant</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/login">J'ai déjà un compte</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-card">
        <div className="container">
          <h2 className="text-2xl font-bold text-center mb-10">Comment ça marche ?</h2>
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

      {/* Footer */}
      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Mouvement — Système de gestion des mutations
      </footer>
    </div>
  );
};

export default LandingPage;
