import { writeFileSync, mkdirSync } from "node:fs";
import { MEAL_CATALOG } from "../mocks/mealCatalog";

mkdirSync("../ios-fuelify/Fuelify/Resources", { recursive: true });
writeFileSync(
  "../ios-fuelify/Fuelify/Resources/MealCatalog.json",
  JSON.stringify(MEAL_CATALOG, null, 1),
);
console.log("Exported", MEAL_CATALOG.length, "meals");
