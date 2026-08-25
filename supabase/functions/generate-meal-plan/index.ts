import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const POSITION_CALORIE_BOOST = {
  goalkeeper: 150, centre_back: 175, full_back: 350, defensive_mid: 275,
  central_mid: 300, attacking_mid: 300, winger: 375, striker: 275,
}

const DAY_TYPE_MULTIPLIER = { rest: 0.9, training: 1.15, match: 1.3, recovery: 1.1 }

const MACRO_SPLITS = {
  rest: { protein: 30, carbs: 40, fats: 30 },
  training: { protein: 25, carbs: 50, fats: 25 },
  match: { protein: 20, carbs: 60, fats: 20 },
  recovery: { protein: 30, carbs: 45, fats: 25 },
}

const SEASON_CALORIE_ADJUSTMENT = { pre_season: 1.1, in_season: 1.0, off_season: 0.92, injury_recovery: 0.95 }

function calculateBMR(gender, weight, height, age) {
  if (gender === 'female') return 10 * weight + 6.25 * height - 5 * age - 161
  return 10 * weight + 6.25 * height - 5 * age + 5
}

function getDayType(weeklySchedule) {
  if (!weeklySchedule || weeklySchedule.length !== 7) return 'training'
  const jsDay = new Date().getDay()
  const idx = jsDay === 0 ? 6 : jsDay - 1
  return weeklySchedule[idx] || 'training'
}

function calculateDayTargets(profile) {
  const bmr = calculateBMR(profile.gender || 'male', profile.weight_kg || profile.weight || 70, profile.height_cm || profile.height || 175, profile.age || 20)
  const tdee = bmr * 1.55
  const dayType = getDayType(profile.weekly_schedule)
  const dayMultiplier = DAY_TYPE_MULTIPLIER[dayType] ?? 1.0
  const seasonAdj = SEASON_CALORIE_ADJUSTMENT[profile.season_phase] ?? 1.0
  const positionBoost = (dayType === 'training' || dayType === 'match') ? (POSITION_CALORIE_BOOST[profile.position] ?? 0) : 0
  const calories = Math.round(tdee * dayMultiplier * seasonAdj + positionBoost)
  const split = MACRO_SPLITS[dayType] ?? MACRO_SPLITS.training
  return {
    dayType,
    calories,
    protein_g: Math.round((calories * split.protein / 100) / 4),
    carbs_g: Math.round((calories * split.carbs / 100) / 4),
    fats_g: Math.round((calories * split.fats / 100) / 9),
  }
}

function buildPrompt(profile, targets, duration) {
  const equipmentList = (profile.kitchen_equipment || []).length > 0 ? (profile.kitchen_equipment || []).join(', ') : 'all standard equipment'
  const dayTypeContext = {
    training: 'This is a TRAINING day. Emphasize accessible carbs pre/post-session and a solid protein hit for recovery.',
    match: 'This is a MATCH day. Prioritize easily digestible high-carb meals pre-match, a light pre-kickoff snack, and a recovery-focused post-match meal.',
    rest: 'This is a REST day. Lighter carbs, keep protein steady, focus on recovery and micronutrients.',
    recovery: 'This is an ACTIVE RECOVERY / injury-recovery day. Prioritize anti-inflammatory foods, steady protein, moderate carbs.',
  }
  return 'You are FuelUp\'s performance nutrition engine, building meals for a young footballer -- not a generic dieter. Never default to weight-loss framing.\n\n' +
    'PLAYER PROFILE:\n' +
    '- Age: ' + (profile.age || 'not specified') + ', Gender: ' + (profile.gender || 'not specified') + '\n' +
    '- Weight: ' + (profile.weight_kg || profile.weight || 'not specified') + 'kg, Height: ' + (profile.height_cm || profile.height || 'not specified') + 'cm\n' +
    '- Position: ' + (profile.position || 'not specified') + '\n' +
    '- Level: ' + (profile.player_level || 'not specified') + ' (never suggest academy-catering-style menus for independent/non-academy players)\n' +
    '- Season phase: ' + (profile.season_phase || 'in_season') + '\n' +
    '- Performance goal: ' + (profile.performance_goal || 'general') + '\n' +
    '- Diet: ' + (profile.diet_type || 'omnivore') + '\n' +
    '- Allergies: ' + ((profile.allergies || []).join(', ') || 'None') + '\n' +
    '- Intolerances: ' + ((profile.intolerances || []).join(', ') || 'None') + '\n' +
    '- Disliked foods: ' + ((profile.disliked_ingredients || []).join(', ') || 'None') + '\n' +
    '- Kitchen equipment ONLY: ' + equipmentList + '\n' +
    '- Cooking skill: ' + (profile.cooking_skill || 'intermediate') + '\n' +
    '- Country: ' + (profile.country_code || profile.country || 'EU') + '\n\n' +
    'TODAY\'S DAY TYPE: ' + targets.dayType.toUpperCase() + '\n' +
    (dayTypeContext[targets.dayType] || '') + '\n\n' +
    'DAILY TARGETS: ' + targets.calories + ' kcal, ' + targets.protein_g + 'g protein, ' + targets.carbs_g + 'g carbs, ' + targets.fats_g + 'g fat\n\n' +
    'CONSTRAINTS:\n' +
    '- ONLY suggest meals makeable with: ' + equipmentList + '. If only microwave and oven, NO stovetop recipes.\n' +
    '- NEVER include allergens or disliked ingredients.\n' +
    '- Every meal needs a one-line "fuelReason" explaining WHY it fits today\'s day type in plain language (this replaces a sports dietitian\'s explanation -- do not skip it).\n' +
    '- Use ingredients available in the user\'s country.\n' +
    '- Each day must have 3 meals: breakfast, lunch, dinner.\n\n' +
    'Generate a ' + duration + '-day meal plan.\n\n' +
    'Respond ONLY with valid JSON:\n' +
    '{"days":[{"day":1,"dayType":"' + targets.dayType + '","meals":[{"slot":"breakfast","name":"Meal Name","calories":400,"protein_g":30,"carbs_g":40,"fats_g":15,"fuelReason":"One sentence on why this fits today.","ingredients":[{"name":"ingredient","quantity":100,"unit":"g"}],"instructions":"Step by step cooking instructions.","prep_time_min":15}]}]}'
}

function categorize(name) {
  const lower = name.toLowerCase()
  const map = {
    chicken:'Proteins',beef:'Proteins',turkey:'Proteins',salmon:'Proteins',cod:'Proteins',tuna:'Proteins',egg:'Proteins',tofu:'Proteins',lamb:'Proteins',pork:'Proteins',shrimp:'Proteins',sardine:'Proteins',mackerel:'Proteins',paneer:'Proteins',
    broccoli:'Vegetables',spinach:'Vegetables',tomato:'Vegetables',pepper:'Vegetables',onion:'Vegetables',garlic:'Vegetables',carrot:'Vegetables',zucchini:'Vegetables',asparagus:'Vegetables',kale:'Vegetables',cucumber:'Vegetables',celery:'Vegetables',mushroom:'Vegetables',lettuce:'Vegetables',bean:'Vegetables',pea:'Vegetables',corn:'Vegetables',
    banana:'Fruits',berries:'Fruits',berry:'Fruits',apple:'Fruits',lemon:'Fruits',avocado:'Fruits',peach:'Fruits',fig:'Fruits',
    milk:'Dairy',yogurt:'Dairy',cheese:'Dairy',butter:'Dairy',cream:'Dairy',feta:'Dairy',skyr:'Dairy',halloumi:'Dairy',
    rice:'Grains',oat:'Grains',quinoa:'Grains',pasta:'Grains',bread:'Grains',toast:'Grains',wrap:'Grains',lentil:'Grains',chickpea:'Grains',
    olive:'Pantry',oil:'Pantry',honey:'Pantry',salt:'Pantry',cinnamon:'Pantry',turmeric:'Pantry',sauce:'Pantry',ginger:'Pantry',vinegar:'Pantry',mustard:'Pantry',soy:'Pantry',jam:'Pantry',protein:'Pantry',
  }
  for (const keyword in map) {
    if (lower.includes(keyword)) return map[keyword]
  }
  return 'Other'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_ANON_KEY'),
      { global: { headers: { Authorization: authHeader } } }
    )
    const svc = createClient(
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    const body = await req.json()
    const duration_days = body.duration_days || 1
    const weekly_budget = body.weekly_budget

    if (duration_days === 7) {
      const { data: sub } = await svc.from('subscriptions').select('plan,status').eq('user_id', user.id).single()
      if (!sub || sub.plan !== 'premium' || !['active','trialing'].includes(sub.status)) {
        return new Response(JSON.stringify({ error: 'Premium required for 7-day plans' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
    }

    const { data: profile } = await svc.from('profiles').select('*').eq('id', user.id).single()
    if (!profile) return new Response(JSON.stringify({ error: 'Profile not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    if (profile.parental_consent_status === 'pending') {
      return new Response(JSON.stringify({ error: 'Parental consent required before generating a plan for this account.', code: 'PARENTAL_CONSENT_PENDING' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const targets = calculateDayTargets(profile)
    const prompt = buildPrompt(profile, targets, duration_days)

    const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + Deno.env.get('OPENAI_API_KEY') },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      }),
    })
    const aiData = await aiRes.json()
    if (!aiData.choices || !aiData.choices[0] || !aiData.choices[0].message || !aiData.choices[0].message.content) throw new Error('AI generation failed')

    const mealPlan = JSON.parse(aiData.choices[0].message.content)

    const { data: plan, error: planErr } = await svc.from('meal_plans').insert({
      user_id: user.id,
      title: duration_days === 7 ? 'Week of ' + new Date().toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }) : targets.dayType.charAt(0).toUpperCase() + targets.dayType.slice(1) + ' Day - ' + new Date().toLocaleDateString('en-GB'),
      duration_days,
      profile_snapshot: profile,
      target_calories: targets.calories,
      target_protein_g: targets.protein_g,
      target_carbs_g: targets.carbs_g,
      target_fats_g: targets.fats_g,
      weekly_budget: weekly_budget || null,
      generation_model: 'gpt-4o',
    }).select().single()
    if (planErr) throw planErr

    const items = mealPlan.days.flatMap((day) =>
      day.meals.map((meal) => ({
        meal_plan_id: plan.id,
        day_number: day.day,
        meal_slot: meal.slot,
        meal_name: meal.name,
        calories: meal.calories,
        protein_g: meal.protein_g,
        carbs_g: meal.carbs_g,
        fats_g: meal.fats_g,
        ingredients: meal.ingredients,
        instructions: (meal.fuelReason ? meal.fuelReason + '\n\n' : '') + meal.instructions,
        prep_time_min: meal.prep_time_min || null,
      }))
    )
    await svc.from('meal_plan_items').insert(items)

    const ingMap = new Map()
    for (const item of items) {
      for (const ing of (item.ingredients || [])) {
        const key = ing.name.toLowerCase()
        if (ingMap.has(key) && ingMap.get(key).unit === ing.unit) {
          ingMap.get(key).quantity += ing.quantity
        } else if (!ingMap.has(key)) {
          ingMap.set(key, { quantity: ing.quantity, unit: ing.unit })
        }
      }
    }

    const { data: shopList } = await svc.from('shopping_lists').insert({ user_id: user.id, meal_plan_id: plan.id }).select().single()

    let sortOrder = 0
    const shopItems = Array.from(ingMap.entries()).map(([name, info]) => ({
      shopping_list_id: shopList.id,
      ingredient_name: name,
      quantity: info.quantity,
      unit: info.unit,
      category: categorize(name),
      sort_order: sortOrder++,
    }))
    if (shopItems.length > 0) await svc.from('shopping_list_items').insert(shopItems)

    if (weekly_budget && duration_days === 7) {
      await svc.from('budget_trackers').insert({ user_id: user.id, meal_plan_id: plan.id, weekly_budget_eur: weekly_budget })
    }

    return new Response(JSON.stringify({
      meal_plan_id: plan.id,
      shopping_list_id: shopList ? shopList.id : null,
      duration_days,
      day_type: targets.dayType,
      target: targets,
      days: mealPlan.days,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
