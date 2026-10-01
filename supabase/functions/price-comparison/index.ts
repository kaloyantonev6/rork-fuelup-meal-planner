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

    const url = new URL(req.url)
    const shoppingListId = url.searchParams.get('shopping_list_id')
    if (!shoppingListId) return new Response(JSON.stringify({ error: 'shopping_list_id required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    // Get user's country
    const { data: profile } = await svc.from('profiles').select('country_code').eq('id', user.id).single()
    const countryCode = profile?.country_code || 'DE'

    // Get shopping list items
    const { data: items } = await svc.from('shopping_list_items').select('ingredient_name, quantity, unit').eq('shopping_list_id', shoppingListId)
    if (!items || items.length === 0) return new Response(JSON.stringify({ retailers: [] }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    // Get retailers for user's country
    const { data: retailers } = await svc.from('grocery_retailers').select('id, name, rank, logo_url').eq('country_code', countryCode).eq('is_active', true).order('rank')

    // Get prices for all ingredients across retailers in this country
    const ingredientNames = items.map((i: any) => i.ingredient_name.toLowerCase())
    const { data: prices } = await svc.from('ingredient_prices').select('ingredient_name, retailer_id, price_eur, unit').in('ingredient_name', ingredientNames)

    // Build comparison per retailer
    const retailerTotals = (retailers || []).map((r: any) => {
      const retailerPrices = (prices || []).filter((p: any) => p.retailer_id === r.id)
      let total = 0
      let matchedItems = 0
      const itemPrices = items.map((item: any) => {
        const price = retailerPrices.find((p: any) => p.ingredient_name === item.ingredient_name.toLowerCase())
        if (price) {
          const itemTotal = price.price_eur * (item.quantity || 1)
          total += itemTotal
          matchedItems++
          return { ingredient: item.ingredient_name, price_eur: itemTotal, available: true }
        }
        return { ingredient: item.ingredient_name, price_eur: null, available: false }
      })

      return {
        retailer_name: r.name,
        retailer_rank: r.rank,
        logo_url: r.logo_url,
        total_eur: Math.round(total * 100) / 100,
        items_matched: matchedItems,
        items_total: items.length,
        items: itemPrices,
      }
    })

    retailerTotals.sort((a: any, b: any) => a.total_eur - b.total_eur)

    return new Response(JSON.stringify({
      country: countryCode,
      retailers: retailerTotals,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
