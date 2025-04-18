'use client'
import { useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { createClientSupabaseClient } from '@/utils/supabase/client'

export default function UserSync() {
  const { user } = useUser()

  useEffect(() => {
    const syncUser = async () => {
      if (!user) return
      
      const supabase = createClientSupabaseClient()
      
      await supabase
        .from('users')
        .upsert({
          clerk_id: user.id,
          email: user.emailAddresses[0].emailAddress,
          first_name: user.firstName,
          last_name: user.lastName,
          avatar_url: user.imageUrl,
          updated_at: new Date().toISOString()
        })
    }

    syncUser()
  }, [user])

  return null
} 