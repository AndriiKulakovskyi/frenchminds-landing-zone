'use client'

import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '../../supabase/client'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { Button } from './ui/button'
import { UserCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Badge } from './ui/badge'
import { useEffect, useState } from 'react'

export default function DashboardNavbar() {
  const supabase = createClient()
  const router = useRouter()
  const [userRole, setUserRole] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    const fetchUserRole = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserEmail(user.email || null)
        const { data } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single()
        
        if (data) {
          setUserRole(data.role)
        }
      }
    }
    fetchUserRole()
  }, [])

  const getRoleBadge = () => {
    if (!userRole) return null
    
    const roleConfig = {
      admin: { label: 'Administrateur', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
      principal_investigator: { label: 'Investigateur Principal', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
    }
    
    const config = roleConfig[userRole as keyof typeof roleConfig]
    if (!config) return null
    
    return <Badge className={config.color}>{config.label}</Badge>
  }

  return (
    <nav className="w-full border-b border-border bg-card py-4">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" prefetch className="flex items-center">
            <Image 
              src="/ff-logo.png" 
              alt="FrenchMinds Logo" 
              width={180} 
              height={60}
              className="h-12 w-auto"
              priority
            />
          </Link>
          {getRoleBadge()}
        </div>
        <div className="flex gap-4 items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <UserCircle className="h-6 w-6" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {userEmail && (
                <div className="px-2 py-1.5 text-sm text-muted-foreground border-b">
                  {userEmail}
                </div>
              )}
              <DropdownMenuItem onClick={async () => {
                await supabase.auth.signOut()
                router.push('/sign-in')
              }}>
                Déconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  )
}