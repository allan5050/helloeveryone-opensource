import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'

export async function requireAdmin() {
  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.user) {
    redirect('/login')
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', session.user.id)
    .single()

  if (error || !profile?.is_admin) {
    redirect('/dashboard')
  }

  return { user: session.user, profile }
}

export async function getAdminStats() {
  const supabase = await createClient()

  const [
    { count: totalUsers },
    { count: activeEvents },
    { data: recentSignups },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .gte('date', new Date().toISOString()),
    supabase
      .from('profiles')
      .select('display_name, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  return {
    totalUsers: totalUsers || 0,
    activeEvents: activeEvents || 0,
    recentSignups: recentSignups || [],
  }
}
