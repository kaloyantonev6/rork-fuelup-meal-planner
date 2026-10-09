import React from "react";
import { Redirect } from "expo-router";

/** Keep old budget links valid after retiring the weekly-budget feature. */
export default function RetiredBudgetScreen() {
  return <Redirect href="/(tabs)/shop" />;
}
