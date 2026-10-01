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

    const { meal_plan_item_id } = await req.json()
    if (!meal_plan_item_id) return new Response(JSON.stringify({ error: 'meal_plan_item_id required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    // Get the meal item and verify ownership
    const { data: item } = await svc.from('meal_plan_items').select('*, meal_plans!inner(user_id, profile_snapshot, target_calories)').eq('id', meal_plan_item_id).single()
    if (!item || item.meal_plans.user_id !== user.id) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    const profile = item.meal_plans.profile_snapshot
    const equipmentList = (profile.kitchen_equipment || []).length > 0 ? (profile.kitchen_equipment || []).join(', ') : 'all standard equipment'

    const prompt = `You are a nutritionist. Replace this meal with a different one.

Current meal to replace: ${item.meal_name} (${item.meal_slot})
User diet: ${profile.diet_type || 'omnivore'}
Allergies: ${(profile.allergies || []).join(', ') || 'None'}
Disliked: ${(profile.disliked_ingredients || []).join(', ') || 'None'}
Equipment ONLY: ${equipmentList}
Target calories for this meal: ~${item.calories} kcal
Cooking skill: ${profile.cooking_skill || 'intermediate'}

Generate ONE replacement ${item.meal_slot} meal. Must be DIFFERENT from "${item.meal_name}".

Respond ONLY with valid JSON:
{"name":"New Meal Name","calories":400,"protein_g":30,"carbs_g":40,"fats_g":15,"ingredients":[{"name":"ingredient","quantity":100,"unit":"g"}],"instructions":"Step by step instructions.","prep_time_min":15}`

    const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + Deno.env.get('OPENAI_API_KEY') },
      body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' }, temperature: 0.9 }),
    })
    const aiData = await aiRes.json()
    const newMeal = JSON.parse(aiData.choices[0].message.content)

    const { data: updated } = await svc.from('meal_plan_items').update({
      meal_name: newMeal.name,
      calories: newMeal.calories,
      protein_g: newMeal.protein_g,
      carbs_g: newMeal.carbs_g,
      fats_g: newMeal.fats_g,
      ingredients: newMeal.ingredients,
      instructions: newMeal.instructions,
      prep_time_min: newMeal.prep_time_min,
    }).eq('id', meal_plan_item_id).select().single()

    return new Response(JSON.stringify({ meal: updated }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
