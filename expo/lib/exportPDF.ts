import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

export async function exportMealPlanPDF(plan: any) {
  const html = generateMealPlanHTML(plan);
  const { uri } = await Print.printToFileAsync({ html, base64: false });
  if (Platform.OS === 'web') {
    await Print.printAsync({ html });
  } else {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Export Meal Plan',
      UTI: 'com.adobe.pdf',
    });
  }
}

export async function exportShoppingListPDF(plan: any) {
  const html = generateShoppingListHTML(plan);
  const { uri } = await Print.printToFileAsync({ html, base64: false });
  if (Platform.OS === 'web') {
    await Print.printAsync({ html });
  } else {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Export Shopping List',
      UTI: 'com.adobe.pdf',
    });
  }
}

function generateMealPlanHTML(plan: any): string {
  const meals = plan.meals ?? [];
  const totalCalories = meals.reduce((sum: number, m: any) => sum + (m.calories ?? 0), 0);
  const totalProtein = meals.reduce((sum: number, m: any) => sum + (m.protein ?? 0), 0);
  const totalCarbs = meals.reduce((sum: number, m: any) => sum + (m.carbs ?? 0), 0);
  const totalFats = meals.reduce((sum: number, m: any) => sum + (m.fat ?? m.fats ?? 0), 0);

  const mealsHTML = meals.map((meal: any, index: number) => `
    <div class="meal-card">
      <div class="meal-header">
        <span class="meal-number">MEAL ${index + 1}</span>
        <span class="meal-type">${meal.mealType ?? meal.type ?? ''}</span>
      </div>
      <h3 class="meal-name">${meal.name}</h3>
      <div class="macro-row">
        <span class="macro">🔥 ${meal.calories ?? 0} kcal</span>
        <span class="macro">💪 ${meal.protein ?? 0}g protein</span>
        <span class="macro">🌾 ${meal.carbs ?? 0}g carbs</span>
        <span class="macro">🥑 ${meal.fat ?? meal.fats ?? 0}g fats</span>
      </div>
      <div class="section-label">Ingredients</div>
      <ul class="ingredients">
        ${(meal.ingredients ?? []).map((i: string) => `<li>${i}</li>`).join('')}
      </ul>
    </div>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #1a1a2e; background: #fff; padding: 40px; }
        .header { background: linear-gradient(135deg, #2dd4a8, #0f766e); padding: 30px; border-radius: 16px; margin-bottom: 30px; color: white; }
        .app-name { font-size: 28px; font-weight: 800; letter-spacing: -0.5px; }
        .plan-title { font-size: 16px; opacity: 0.85; margin-top: 6px; }
        .plan-date { font-size: 13px; opacity: 0.7; margin-top: 4px; }
        .macros-summary { display: flex; gap: 12px; margin-bottom: 30px; }
        .macro-box { flex: 1; background: #f0fdf9; border: 1px solid #2dd4a820; border-radius: 12px; padding: 16px; text-align: center; }
        .macro-box .value { font-size: 22px; font-weight: 800; color: #0f766e; }
        .macro-box .label { font-size: 11px; color: #6b7280; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
        .meal-card { background: #fafafa; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; margin-bottom: 16px; page-break-inside: avoid; }
        .meal-header { display: flex; justify-content: space-between; margin-bottom: 8px; }
        .meal-number { font-size: 11px; font-weight: 700; color: #2dd4a8; text-transform: uppercase; letter-spacing: 1px; }
        .meal-type { font-size: 11px; color: #9ca3af; text-transform: uppercase; }
        .meal-name { font-size: 18px; font-weight: 700; color: #111827; margin-bottom: 10px; }
        .macro-row { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 14px; }
        .macro { font-size: 12px; background: #f3f4f6; padding: 4px 10px; border-radius: 20px; color: #374151; }
        .section-label { font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 6px; margin-top: 12px; }
        .ingredients { padding-left: 18px; }
        .ingredients li { font-size: 13px; color: #374151; margin-bottom: 3px; }
        .footer { text-align: center; margin-top: 40px; color: #9ca3af; font-size: 12px; border-top: 1px solid #e5e7eb; padding-top: 20px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="app-name">⚡ FuelUp</div>
        <div class="plan-title">${plan.title ?? 'Your Meal Plan'}</div>
        <div class="plan-date">Generated on ${new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
      </div>
      <div class="macros-summary">
        <div class="macro-box"><div class="value">${totalCalories}</div><div class="label">Calories</div></div>
        <div class="macro-box"><div class="value">${totalProtein}g</div><div class="label">Protein</div></div>
        <div class="macro-box"><div class="value">${totalCarbs}g</div><div class="label">Carbs</div></div>
        <div class="macro-box"><div class="value">${totalFats}g</div><div class="label">Fats</div></div>
      </div>
      ${mealsHTML}
      <div class="footer">Generated by FuelUp • Your AI-powered nutrition companion</div>
    </body>
    </html>
  `;
}

function generateShoppingListHTML(plan: any): string {
  const meals = plan.meals ?? [];
  const allIngredients: string[] = meals.flatMap((m: any) => m.ingredients ?? []);

  const categories: Record<string, string[]> = {
    'Proteins': [],
    'Vegetables': [],
    'Fruits': [],
    'Dairy': [],
    'Grains & Carbs': [],
    'Pantry & Spices': [],
  };

  const proteinKeywords = ['chicken','beef','salmon','turkey','tuna','egg','eggs','steak','fish','pork','lamb','cod','tofu','tempeh','sardine','shrimp'];
  const vegKeywords = ['broccoli','spinach','kale','peppers','onion','garlic','tomato','cucumber','zucchini','asparagus','celery','carrot','lettuce','arugula','cauliflower'];
  const fruitKeywords = ['apple','banana','berries','blueberry','strawberry','lemon','orange','mango','avocado','fig','peach'];
  const dairyKeywords = ['milk','yogurt','cheese','butter','cream','feta','halloumi','skyr','cottage','parmesan'];
  const grainKeywords = ['rice','pasta','bread','oats','quinoa','potato','tortilla','wrap','noodle','flour'];

  allIngredients.forEach(ingredient => {
    const lower = ingredient.toLowerCase();
    if (proteinKeywords.some(k => lower.includes(k))) categories['Proteins'].push(ingredient);
    else if (vegKeywords.some(k => lower.includes(k))) categories['Vegetables'].push(ingredient);
    else if (fruitKeywords.some(k => lower.includes(k))) categories['Fruits'].push(ingredient);
    else if (dairyKeywords.some(k => lower.includes(k))) categories['Dairy'].push(ingredient);
    else if (grainKeywords.some(k => lower.includes(k))) categories['Grains & Carbs'].push(ingredient);
    else categories['Pantry & Spices'].push(ingredient);
  });

  const categoryColors: Record<string, string> = {
    'Proteins': '#ef4444',
    'Vegetables': '#22c55e',
    'Fruits': '#f97316',
    'Dairy': '#3b82f6',
    'Grains & Carbs': '#f59e0b',
    'Pantry & Spices': '#8b5cf6',
  };

  const categoriesHTML = Object.entries(categories)
    .filter(([, items]) => items.length > 0)
    .map(([category, items]) => `
      <div class="category-section">
        <div class="category-header" style="border-left: 4px solid ${categoryColors[category]}">
          ${category} <span class="item-count">${items.length} items</span>
        </div>
        <div class="items-grid">
          ${items.map(item => `
            <div class="item-row">
              <div class="checkbox"></div>
              <span class="item-name">${item}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #1a1a2e; background: #fff; padding: 40px; }
        .header { background: linear-gradient(135deg, #2dd4a8, #0f766e); padding: 30px; border-radius: 16px; margin-bottom: 30px; color: white; }
        .app-name { font-size: 28px; font-weight: 800; }
        .list-title { font-size: 16px; opacity: 0.85; margin-top: 6px; }
        .list-date { font-size: 13px; opacity: 0.7; margin-top: 4px; }
        .category-section { margin-bottom: 24px; }
        .category-header { font-size: 14px; font-weight: 700; color: #111827; padding: 10px 14px; background: #f9fafb; border-radius: 8px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; }
        .item-count { font-size: 11px; color: #9ca3af; font-weight: 500; }
        .items-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; padding: 0 4px; }
        .item-row { display: flex; align-items: center; gap: 10px; padding: 8px 10px; background: #fafafa; border-radius: 8px; border: 1px solid #f3f4f6; }
        .checkbox { width: 18px; height: 18px; border: 2px solid #d1d5db; border-radius: 4px; flex-shrink: 0; }
        .item-name { font-size: 13px; color: #374151; }
        .footer { text-align: center; margin-top: 40px; color: #9ca3af; font-size: 12px; border-top: 1px solid #e5e7eb; padding-top: 20px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="app-name">⚡ FuelUp</div>
        <div class="list-title">Shopping List — ${plan.title ?? 'Meal Plan'}</div>
        <div class="list-date">${new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
      </div>
      ${categoriesHTML}
      <div class="footer">Generated by FuelUp • Your AI-powered nutrition companion</div>
    </body>
    </html>
  `;
}
