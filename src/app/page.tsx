import Footer from "@/components/footer";
import Hero from "@/components/hero";
import Navbar from "@/components/navbar";
import { ArrowUpRight, CheckCircle2, Shield, Users, Zap } from 'lucide-react';
import { createClient } from "../../supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Navbar />
      <Hero />
      
      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Fonctionnalités de la Plateforme</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Une solution sécurisée et conforme pour la gestion des données de recherche clinique du projet PEPR PROPSY FrenchMinds.</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: <Zap className="w-6 h-6" />, title: "Transfert Rapide", description: "Upload de fichiers jusqu'à 10 Go avec validation automatique" },
              { icon: <Shield className="w-6 h-6" />, title: "Sécurité Maximale", description: "Chiffrement de niveau bancaire et conformité RGPD" },
              { icon: <Users className="w-6 h-6" />, title: "Gestion Multi-PI", description: "Accès sécurisé pour tous les investigateurs du projet" },
              { icon: <CheckCircle2 className="w-6 h-6" />, title: "Contrôle Qualité", description: "Validation automatique avant envoi au CRO" }
            ].map((feature, index) => (
              <div key={index} className="p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="text-blue-600 mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">5</div>
              <div className="text-blue-100">Modalités de Données</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">100%</div>
              <div className="text-blue-100">Conformité RGPD</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">24/7</div>
              <div className="text-blue-100">Support Technique</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Vous êtes Investigateur Principal sur PEPR PROPSY FrenchMinds ?</h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">Demandez votre compte pour commencer à télécharger vos données de recherche de manière sécurisée.</p>
          <a href="/sign-up" className="inline-flex items-center px-6 py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
            Demander un Compte
            <ArrowUpRight className="ml-2 w-4 h-4" />
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
