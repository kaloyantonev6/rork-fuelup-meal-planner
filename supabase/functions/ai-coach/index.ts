import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')!
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authHeader } } })
    const svc = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    // Check premium
    const { data: sub } = await svc.from('subscriptions').select('plan,status').eq('user_id', user.id).single()
    if (!sub || sub.plan !== 'premium' || !['active','trialing'].includes(sub.status)) {
      return new Response(JSON.stringify({ error: 'Premium required' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { conversation_id, message } = await req.json()
    if (!message) return new Response(JSON.stringify({ error: 'Message required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    const { data: profile } = await svc.from('profiles').select('*').eq('id', user.id).single()

    let convId = conversation_id
    if (!convId) {
      const { data: conv } = await svc.from('ai_coach_conversations').insert({ user_id: user.id, title: message.substring(0, 50) }).select().single()
      convId = conv!.id
    }

    await svc.from('ai_coach_messages').insert({ conversation_id: convId, role: 'user', content: message })

    const { data: history } = await svc.from('ai_coach_messages').select('role,content').eq('conversation_id', convId).order('created_at', { ascending: true }).limit(20)

    const systemPrompt = `You are FuelUp's AI Nutritionist - a certified, friendly nutrition coach. You provide personalized advice based on the user's profile.

USER PROFILE:
- Age: ${profile?.age || 'unknown'}, Gender: ${profile?.gender || 'unknown'}
- Weight: ${profile?.weight_kg || 'unknown'}kg, Height: ${profile?.height_cm || 'unknown'}cm
- BMR: ${profile?.bmr_cached || 'unknown'} kcal, TDEE: ${profile?.tdee_cached || 'unknown'} kcal
- Diet: ${profile?.diet_type || 'omnivore'}, Goal: ${profile?.fitness_goal || 'maintain'}
- Allergies: ${(profile?.allergies || []).join(', ') || 'None'}

Rules:
- Be concise and actionable (2-4 sentences per response unless detail is needed)
- Use science-based nutrition advice
- Reference the user's specific profile data when relevant
- Suggest specific foods, portions, and timing
- Never diagnose medical conditions - recommend seeing a doctor when appropriate`

    const messages = [
      { role: 'system', content: systemPrompt },
      ...(history || []).map((m: any) => ({ role: m.role, content: m.content })),
    ]

    const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + Deno.env.get('OPENAI_API_KEY') },
      body: JSON.stringify({ model: 'gpt-4o-mini', messages, temperature: 0.7, max_tokens: 500 }),
    })
    const aiData = await aiRes.json()
    const reply = aiData.choices[0].message.content

    await svc.from('ai_coach_messages').insert({ conversation_id: convId, role: 'assistant', content: reply })

    return new Response(JSON.stringify({ conversation_id: convId, response: reply }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
