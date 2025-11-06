import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '../../supabase/server'
import { Button } from './ui/button'
import { User, UserCircle } from 'lucide-react'
import UserProfile from './user-profile'

export default async function Navbar() {
  const supabase = createClient()

  const { data: { user } } = await (await supabase).auth.getUser()


  return (
    <nav className="w-full border-b border-gray-200 bg-white py-2">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link href="/" prefetch className="flex items-center">
          <Image 
            src="/ff-logo.png" 
            alt="FrenchMinds Logo" 
            width={180} 
            height={60}
            className="h-12 w-auto"
            priority
          />
        </Link>
        <div className="flex gap-4 items-center">
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                <Button>
                  Tableau de Bord
                </Button>
              </Link>
              <UserProfile  />
            </>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="px-4 py-2 text-sm font-medium text-white bg-black rounded-md hover:bg-gray-800"
              >
                Connexion
              </Link>
              <Link
                href="/sign-up"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Demander un Compte
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
