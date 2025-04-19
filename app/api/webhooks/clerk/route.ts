import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { supabaseAdmin } from '@/utils/supabase/server'

export async function POST(req: Request) {
  try {
    console.log('Webhook received - Starting processing')
    const payload = await req.json()
    const headerList = await headers()
    const svix_id = headerList.get("svix-id") || ''
    const svix_timestamp = headerList.get("svix-timestamp") || ''
    const svix_signature = headerList.get("svix-signature") || ''
    
    console.log('Webhook headers:', {
      svix_id,
      svix_timestamp,
      svix_signature
    })
    
    if (!process.env.CLERK_WEBHOOK_SECRET) {
      console.error('Missing CLERK_WEBHOOK_SECRET')
      return new Response('Missing webhook secret', { status: 500 })
    }

    console.log('Verifying webhook signature...')
    const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET)
    const evt = wh.verify(JSON.stringify(payload), {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as any

    console.log('Webhook event type:', evt.type)
    console.log('Full webhook payload:', JSON.stringify(payload, null, 2))

    // Handle user creation/update
    if (evt.type === 'user.created' || evt.type === 'user.updated') {
      // For Svix testing, the data structure is slightly different
      const userData = evt.data || payload.data
      const { id, first_name, last_name, email_addresses, profile_image_url } = userData
      
      console.log('Preparing to sync user to Supabase:', { 
        id, 
        email: email_addresses?.[0]?.email_address || payload.data?.email,
        first_name: first_name || payload.data?.first_name,
        last_name: last_name || payload.data?.last_name,
        profile_image_url: profile_image_url || payload.data?.profile_image_url
      })
      
      const userToSync = {
        clerk_id: id || payload.data?.id,
        email: email_addresses?.[0]?.email_address || payload.data?.email,
        first_name: first_name || payload.data?.first_name,
        last_name: last_name || payload.data?.last_name,
        avatar_url: profile_image_url || payload.data?.profile_image_url,
        updated_at: new Date().toISOString()
      }
      
      console.log('Attempting Supabase upsert with data:', userToSync)
      
      const { data, error } = await supabaseAdmin
        .from('users')
        .upsert(userToSync)
        .select()

      if (error) {
        console.error('Supabase sync error:', error)
        return new Response(JSON.stringify({ error: error.message }), { status: 500 })
      }

      console.log('User synced successfully to Supabase:', data)
    }

    // Handle user deletion
    if (evt.type === 'user.deleted') {
      const id = evt.data?.id || payload.data?.id
      
      console.log('Deleting user from Supabase:', id)
      
      const { error } = await supabaseAdmin
        .from('users')
        .delete()
        .eq('clerk_id', id)

      if (error) {
        console.error('Supabase deletion error:', error)
        return new Response(JSON.stringify({ error: error.message }), { status: 500 })
      }

      console.log('User deleted successfully from Supabase')
    }

    return new Response('', { status: 200 })
  } catch (err) {
    console.error('Webhook processing error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 })
  }
} 