import { writeFileSync, mkdirSync } from "node:fs";
import { MEAL_CATALOG } from "../mocks/mealCatalog";

mkdirSync("../ios/FuelUp/Resources", { recursive: true });
writeFileSync(
  "../ios/FuelUp/Resources/MealCatalog.json",
  JSON.stringify(MEAL_CATALOG, null, 1),
);
console.log("Exported", MEAL_CATALOG.length, "meals");
