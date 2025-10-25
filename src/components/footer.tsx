import Link from 'next/link';
import { Twitter, Linkedin, Github } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-50 border-t border-gray-100">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Product Column */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Plateforme</h3>
            <ul className="space-y-2">
              <li><Link href="#features" className="text-gray-600 hover:text-blue-600">Fonctionnalités</Link></li>
              <li><Link href="/sign-up" className="text-gray-600 hover:text-blue-600">Demander un Compte</Link></li>
              <li><Link href="/dashboard" className="text-gray-600 hover:text-blue-600">Tableau de Bord</Link></li>
              <li><Link href="https://pepr-propsy.fr/" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-blue-600">Site PROPSY</Link></li>
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Projet</h3>
            <ul className="space-y-2">
              <li><Link href="https://pepr-propsy.fr/" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-blue-600">À Propos</Link></li>
              <li><Link href="https://pepr-propsy.fr/" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-blue-600">PEPR PROPSY</Link></li>
              <li><Link href="https://pepr-propsy.fr/" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-blue-600">Équipe</Link></li>
              <li><Link href="https://pepr-propsy.fr/" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-blue-600">Publications</Link></li>
            </ul>
          </div>

          {/* Resources Column */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Ressources</h3>
            <ul className="space-y-2">
              <li><Link href="#" className="text-gray-600 hover:text-blue-600">Documentation</Link></li>
              <li><Link href="#" className="text-gray-600 hover:text-blue-600">Centre d'Aide</Link></li>
              <li><Link href="#" className="text-gray-600 hover:text-blue-600">Support</Link></li>
              <li><Link href="#" className="text-gray-600 hover:text-blue-600">Statut</Link></li>
            </ul>
          </div>

          {/* Legal Column */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Légal</h3>
            <ul className="space-y-2">
              <li><Link href="#" className="text-gray-600 hover:text-blue-600">Confidentialité</Link></li>
              <li><Link href="#" className="text-gray-600 hover:text-blue-600">Conditions d'Utilisation</Link></li>
              <li><Link href="#" className="text-gray-600 hover:text-blue-600">Sécurité</Link></li>
              <li><Link href="#" className="text-gray-600 hover:text-blue-600">Cookies</Link></li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-gray-200">
          <div className="text-gray-600 mb-4 md:mb-0">
            © {currentYear} PEPR PROPSY FrenchMinds. Tous droits réservés.
          </div>
          
          <div className="flex space-x-6">
            <a href="https://pepr-propsy.fr/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-500">
              <span className="sr-only">Twitter</span>
              <Twitter className="h-6 w-6" />
            </a>
            <a href="https://pepr-propsy.fr/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-500">
              <span className="sr-only">LinkedIn</span>
              <Linkedin className="h-6 w-6" />
            </a>
            <a href="https://pepr-propsy.fr/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-500">
              <span className="sr-only">GitHub</span>
              <Github className="h-6 w-6" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
