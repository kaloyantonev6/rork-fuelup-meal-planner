export const EU_COUNTRIES_WITH_FLAGS: { code: string; name: string; flag: string }[] = [
  { code: "AT", name: "Austria", flag: "🇦🇹" },
  { code: "BE", name: "Belgium", flag: "🇧🇪" },
  { code: "BG", name: "Bulgaria", flag: "🇧🇬" },
  { code: "HR", name: "Croatia", flag: "🇭🇷" },
  { code: "CY", name: "Cyprus", flag: "🇨🇾" },
  { code: "CZ", name: "Czech Republic", flag: "🇨🇿" },
  { code: "DK", name: "Denmark", flag: "🇩🇰" },
  { code: "EE", name: "Estonia", flag: "🇪🇪" },
  { code: "FI", name: "Finland", flag: "🇫🇮" },
  { code: "FR", name: "France", flag: "🇫🇷" },
  { code: "DE", name: "Germany", flag: "🇩🇪" },
  { code: "GR", name: "Greece", flag: "🇬🇷" },
  { code: "HU", name: "Hungary", flag: "🇭🇺" },
  { code: "IE", name: "Ireland", flag: "🇮🇪" },
  { code: "IT", name: "Italy", flag: "🇮🇹" },
  { code: "LV", name: "Latvia", flag: "🇱🇻" },
  { code: "LT", name: "Lithuania", flag: "🇱🇹" },
  { code: "LU", name: "Luxembourg", flag: "🇱🇺" },
  { code: "MT", name: "Malta", flag: "🇲🇹" },
  { code: "NL", name: "Netherlands", flag: "🇳🇱" },
  { code: "PL", name: "Poland", flag: "🇵🇱" },
  { code: "PT", name: "Portugal", flag: "🇵🇹" },
  { code: "RO", name: "Romania", flag: "🇷🇴" },
  { code: "SK", name: "Slovakia", flag: "🇸🇰" },
  { code: "SI", name: "Slovenia", flag: "🇸🇮" },
  { code: "ES", name: "Spain", flag: "🇪🇸" },
  { code: "SE", name: "Sweden", flag: "🇸🇪" },
];

// Legacy compat — some code still references EU_COUNTRIES as string[]
export const EU_COUNTRIES = EU_COUNTRIES_WITH_FLAGS.map((c) => c.name) as unknown as readonly string[];

export const FOOTBALL_POSITIONS = [
  { id: "goalkeeper", label: "Goalkeeper", icon: "🧤", desc: "Reactions & power" },
  { id: "centre_back", label: "Centre-Back", icon: "🛡️", desc: "Strength & aerial duels" },
  { id: "full_back", label: "Full-Back / Wing-Back", icon: "🏃", desc: "Endurance & crossing" },
  { id: "defensive_mid", label: "Defensive Midfielder", icon: "⚙️", desc: "Engine & ball winning" },
  { id: "central_mid", label: "Central Midfielder", icon: "🎯", desc: "Box-to-box coverage" },
  { id: "attacking_mid", label: "Attacking Mid / No. 10", icon: "🎨", desc: "Creativity & vision" },
  { id: "winger", label: "Winger", icon: "⚡", desc: "Sprint speed & dribbling" },
  { id: "striker", label: "Striker", icon: "🔥", desc: "Explosiveness & finishing" },
] as const;

export const PLAYER_LEVELS = [
  { id: "recreational", label: "Recreational / Sunday League", icon: "🏟️", desc: "Playing for fun & fitness" },
  { id: "amateur", label: "Amateur Competitive / Club", icon: "⚽", desc: "Organized competitive football" },
  { id: "academy", label: "Academy / Semi-Pro", icon: "⭐", desc: "Serious, structured training" },
  { id: "professional", label: "Professional", icon: "🏆", desc: "Paid to play" },
] as const;

export const TRAINING_FREQUENCIES = [
  { id: "1-2", label: "1–2× per week", icon: "📅", desc: "Light training schedule" },
  { id: "3-4", label: "3–4× per week", icon: "📅", desc: "Regular training load" },
  { id: "5-6", label: "5–6× per week", icon: "📅", desc: "High training frequency" },
  { id: "daily", label: "Daily + matches", icon: "🔥", desc: "Elite-level commitment" },
] as const;

export const SEASON_PHASES = [
  { id: "pre_season", label: "Pre-Season", icon: "🏋️", desc: "Building fitness & strength" },
  { id: "in_season", label: "In-Season", icon: "⚽", desc: "Active competition period" },
  { id: "off_season", label: "Off-Season", icon: "🏖️", desc: "Recovery & maintenance" },
  { id: "injury_recovery", label: "Injury Recovery", icon: "🩹", desc: "Healing & rehabilitation" },
] as const;

export const PERFORMANCE_GOALS = [
  { id: "lean_fast", label: "Get leaner & faster", icon: "⚡", desc: "Drop weight, gain speed" },
  { id: "endurance", label: "Build match endurance", icon: "🏃", desc: "Last 90 minutes and beyond" },
  { id: "muscle_power", label: "Gain muscle & power", icon: "💪", desc: "Get stronger for duels" },
  { id: "injury_recovery", label: "Recover from injury", icon: "🩹", desc: "Fuel healing & return" },
  { id: "general", label: "General performance", icon: "🎯", desc: "Overall match-day fueling" },
] as const;

export const DIET_TYPES = [
  { id: "balanced", label: "Balanced", icon: "🍽️" },
  { id: "vegetarian", label: "Vegetarian", icon: "🥬" },
  { id: "vegan", label: "Vegan", icon: "🌱" },
  { id: "pescatarian", label: "Pescatarian", icon: "🐟" },
  { id: "mediterranean", label: "Mediterranean", icon: "🫒" },
  { id: "halal", label: "Halal", icon: "🕌" },
] as const;

export const ALLERGY_OPTIONS = [
  { id: "gluten", label: "Gluten", icon: "🌾" },
  { id: "dairy", label: "Dairy", icon: "🥛" },
  { id: "nuts", label: "Nuts", icon: "🥜" },
  { id: "soy", label: "Soy", icon: "🫘" },
  { id: "eggs", label: "Eggs", icon: "🥚" },
  { id: "shellfish", label: "Shellfish", icon: "🦐" },
  { id: "none", label: "None", icon: "✅" },
] as const;

export const GENDER_OPTIONS = [
  { id: "male", label: "Male", icon: "♂️" },
  { id: "female", label: "Female", icon: "♀️" },
  { id: "other", label: "Other", icon: "⚧️" },
] as const;

export const COOKING_SKILLS = [
  { id: "beginner", label: "Beginner", icon: "🍳", desc: "I can boil water and follow simple steps" },
  { id: "intermediate", label: "Intermediate", icon: "👨‍🍳", desc: "I'm comfortable with basic cooking techniques" },
  { id: "advanced", label: "Advanced", icon: "🔥", desc: "I enjoy complex recipes and new techniques" },
] as const;

export const COOK_TIME_OPTIONS = [
  { id: "any", label: "Any time", icon: "♾️" },
  { id: "under_15", label: "Under 15 min", icon: "⚡" },
  { id: "under_30", label: "Under 30 min", icon: "⏱" },
  { id: "under_45", label: "Under 45 min", icon: "🕐" },
] as const;

export type CookTimeFilter = typeof COOK_TIME_OPTIONS[number]["id"];

export const WEEKDAYS = [
  { id: 0, label: "Mon", icon: "📅" },
  { id: 1, label: "Tue", icon: "📅" },
  { id: 2, label: "Wed", icon: "📅" },
  { id: 3, label: "Thu", icon: "📅" },
  { id: 4, label: "Fri", icon: "📅" },
  { id: 5, label: "Sat", icon: "📅" },
  { id: 6, label: "Sun", icon: "📅" },
] as const;

export const DAY_TYPE_OPTIONS = [
  { id: "training", label: "Training", icon: "🟢", color: "#22c55e" },
  { id: "match", label: "Match Day", icon: "🔴", color: "#ef4444" },
  { id: "rest", label: "Rest", icon: "⚪", color: "#6B7280" },
  { id: "recovery", label: "Recovery", icon: "🟡", color: "#f59e0b" },
] as const;

// Default weekly schedule: Mon-Sun
export const DEFAULT_WEEKLY_SCHEDULE: string[] = [
  "training", // Mon
  "training", // Tue
  "rest",     // Wed
  "training", // Thu
  "training", // Fri
  "match",    // Sat
  "recovery", // Sun
];

// Legacy compat — keep for any existing references
export const FITNESS_GOALS = [
  { id: "lose_fat", label: "Lose Fat", icon: "🔥" },
  { id: "build_muscle", label: "Build Muscle", icon: "💪" },
  { id: "maintain", label: "Maintain", icon: "⚖️" },
  { id: "improve_energy", label: "Improve Energy", icon: "⚡" },
] as const;

export const ACTIVITY_LEVELS = [
  { id: "sedentary", label: "Sedentary", desc: "Little to no exercise" },
  { id: "light", label: "Light", desc: "1-2 days/week" },
  { id: "moderate", label: "Moderate", desc: "3-5 days/week" },
  { id: "active", label: "Active", desc: "6-7 days/week" },
  { id: "very_active", label: "Very Active", desc: "Athlete level" },
] as const;

export const BUDGET_PREFERENCES = [
  { id: "budget", label: "Budget-Friendly", icon: "💰", desc: "Keep costs low" },
  { id: "moderate", label: "Moderate", icon: "⚖️", desc: "Balance quality & price" },
  { id: "premium", label: "Premium", icon: "✨", desc: "Best ingredients" },
] as const;

export const KITCHEN_EQUIPMENT = [
  { id: "oven", label: "Oven", icon: "🔥" },
  { id: "microwave", label: "Microwave", icon: "📡" },
  { id: "stovetop", label: "Stovetop", icon: "🍳" },
  { id: "air_fryer", label: "Air Fryer", icon: "🌀" },
  { id: "grill", label: "Grill", icon: "🥩" },
  { id: "blender", label: "Blender", icon: "🥤" },
] as const;

export const KITCHEN_TYPES = [
  { id: "dorm", label: "Dorm Room", icon: "🏠", desc: "Microwave, kettle, maybe a hot plate", equipment: ["microwave", "kettle", "hot_plate"] },
  { id: "shared", label: "Shared Kitchen", icon: "🍳", desc: "Basic oven, stovetop, one pan, one pot", equipment: ["microwave", "kettle", "stovetop", "oven", "pan", "pot"] },
  { id: "full", label: "Full Kitchen", icon: "👨‍🍳", desc: "Fully equipped, I have everything", equipment: ["microwave", "kettle", "stovetop", "oven", "pan", "pot", "blender", "baking_tray", "mixer", "food_processor"] },
] as const;

export const MEAL_PREP_STYLES = [
  { id: "daily", label: "I cook daily", icon: "🍽️" },
  { id: "sometimes", label: "Sometimes", icon: "🔄" },
  { id: "weekly", label: "Weekly batch cook", icon: "📦" },
] as const;

export const COOK_AVAILABILITY = [
  { id: "no_cooking", label: "No cooking", icon: "🚫", desc: "Microwave & assembly only" },
  { id: "quick", label: "Quick meals", icon: "⚡", desc: "Up to 15-20 min" },
  { id: "willing", label: "Willing to cook", icon: "🍳", desc: "Happy to spend time cooking" },
] as const;

// Legacy soccer compat (old 4-position format)
export const SOCCER_POSITIONS = [
  { id: "gk", label: "Goalkeeper", icon: "🧤", desc: "Reactions & power" },
  { id: "defender", label: "Defender", icon: "🛡️", desc: "Strength & duels" },
  { id: "midfielder", label: "Midfielder", icon: "🎯", desc: "Endurance & engine" },
  { id: "forward", label: "Forward", icon: "⚡", desc: "Speed & explosiveness" },
] as const;

export const TRAINING_INTENSITIES = [
  { id: "light", label: "Light", icon: "🚶", desc: "Easy sessions, recovery work" },
  { id: "moderate", label: "Moderate", icon: "🏃", desc: "Standard training load" },
  { id: "hard", label: "Hard", icon: "🔥", desc: "High-intensity, full effort" },
] as const;

export const MATCH_TIME_OPTIONS = [
  { id: "morning", label: "Morning", icon: "🌅", desc: "Kick-off before 12pm" },
  { id: "afternoon", label: "Afternoon", icon: "☀️", desc: "Kick-off 12pm - 5pm" },
  { id: "evening", label: "Evening", icon: "🌆", desc: "Kick-off after 5pm" },
] as const;
