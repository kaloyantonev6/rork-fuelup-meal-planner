import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  // Verify cron secret
  const cronSecret = req.headers.get('x-cron-secret')
  if (cronSecret !== Deno.env.get('CRON_SECRET')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const svc = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  try {
    // Find all premium users with auto_regenerate enabled
    const { data: users } = await svc
      .from('profiles')
      .select('id, email')
      .eq('auto_regenerate', true)

    if (!users || users.length === 0) {
      return new Response(JSON.stringify({ message: 'No users with auto-regeneration enabled', count: 0 }), { status: 200 })
    }

    const results: any[] = []

    for (const user of users) {
      // Verify they're still premium
      const { data: sub } = await svc.from('subscriptions').select('plan,status').eq('user_id', user.id).single()
      if (!sub || sub.plan !== 'premium' || !['active','trialing'].includes(sub.status)) {
        results.push({ user_id: user.id, status: 'skipped', reason: 'not premium' })
        continue
      }

      try {
        // Call generate-meal-plan function internally
        const genRes = await fetch(Deno.env.get('SUPABASE_URL') + '/functions/v1/generate-meal-plan', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
          },
          body: JSON.stringify({ duration_days: 7 }),
        })

        if (genRes.ok) {
          const genData = await genRes.json()
          // Send notification
          await svc.from('notifications').insert({
            user_id: user.id,
            type: 'meal_reminder',
            title: 'New Weekly Meal Plan Ready! 🎉',
            message: 'Your auto-generated 7-day meal plan is ready. Check it out!',
            action_url: '/meal-plan/' + genData.meal_plan_id,
          })
          results.push({ user_id: user.id, status: 'success', meal_plan_id: genData.meal_plan_id })
        } else {
          results.push({ user_id: user.id, status: 'failed', reason: await genRes.text() })
        }
      } catch (err: any) {
        results.push({ user_id: user.id, status: 'error', reason: err.message })
      }
    }

    return new Response(JSON.stringify({
      message: 'Weekly regeneration complete',
      total_users: users.length,
      results,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})
