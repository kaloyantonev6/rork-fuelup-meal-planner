import { useState, useEffect, useCallback, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";

const BUDGET_KEY = "weeklyBudget";
const PURCHASES_KEY = "budgetPurchases";
const BUDGET_HISTORY_KEY = "budgetWeeklyHistory";

export interface BudgetPurchase {
  id: string;
  storeName: string;
  amount: number;
  date: string;
  note?: string;
  weekStart: string;
}

export interface WeeklyBudgetSummary {
  weekStart: string;
  weekEnd: string;
  budget: number;
  totalSpent: number;
  purchaseCount: number;
}

function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split("T")[0];
}

function getWeekEnd(weekStartStr: string): string {
  const d = new Date(weekStartStr + "T00:00:00");
  d.setDate(d.getDate() + 6);
  return d.toISOString().split("T")[0];
}

function formatWeekRange(weekStart: string): string {
  const start = new Date(weekStart + "T00:00:00");
  const end = new Date(weekStart + "T00:00:00");
  end.setDate(end.getDate() + 6);
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${start.toLocaleDateString("en-US", opts)} – ${end.toLocaleDateString("en-US", opts)}`;
}

export const [BudgetProvider, useBudget] = createContextHook(() => {
  const [weeklyBudget, setWeeklyBudget] = useState<number>(50);
  const [purchases, setPurchases] = useState<BudgetPurchase[]>([]);
  const [weeklyHistory, setWeeklyHistory] = useState<WeeklyBudgetSummary[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const currentWeekStart = useMemo(() => getWeekStart(new Date()), []);
  const currentWeekEnd = useMemo(() => getWeekEnd(currentWeekStart), [currentWeekStart]);
  const currentWeekRange = useMemo(() => formatWeekRange(currentWeekStart), [currentWeekStart]);

  useEffect(() => {
    const load = async () => {
      try {
        const [budgetStr, purchasesStr, historyStr] = await Promise.all([
          AsyncStorage.getItem(BUDGET_KEY),
          AsyncStorage.getItem(PURCHASES_KEY),
          AsyncStorage.getItem(BUDGET_HISTORY_KEY),
        ]);

        if (budgetStr) {
          setWeeklyBudget(JSON.parse(budgetStr));
        }

        let allPurchases: BudgetPurchase[] = [];
        if (purchasesStr) {
          allPurchases = JSON.parse(purchasesStr);
          setPurchases(allPurchases);
        }

        let history: WeeklyBudgetSummary[] = [];
        if (historyStr) {
          history = JSON.parse(historyStr);
          setWeeklyHistory(history);
        }

        const currentWS = getWeekStart(new Date());
        const pastPurchases = allPurchases.filter((p) => p.weekStart < currentWS);
        if (pastPurchases.length > 0) {
          const weekGroups = new Map<string, BudgetPurchase[]>();
          pastPurchases.forEach((p) => {
            const existing = weekGroups.get(p.weekStart) || [];
            existing.push(p);
            weekGroups.set(p.weekStart, existing);
          });

          const existingWeeks = new Set(history.map((h) => h.weekStart));
          const newSummaries: WeeklyBudgetSummary[] = [];

          weekGroups.forEach((groupPurchases, ws) => {
            if (!existingWeeks.has(ws)) {
              newSummaries.push({
                weekStart: ws,
                weekEnd: getWeekEnd(ws),
                budget: budgetStr ? JSON.parse(budgetStr) : 50,
                totalSpent: groupPurchases.reduce((sum, p) => sum + p.amount, 0),
                purchaseCount: groupPurchases.length,
              });
            }
          });

          if (newSummaries.length > 0) {
            const updatedHistory = [...history, ...newSummaries]
              .sort((a, b) => b.weekStart.localeCompare(a.weekStart))
              .slice(0, 8);
            setWeeklyHistory(updatedHistory);
            await AsyncStorage.setItem(BUDGET_HISTORY_KEY, JSON.stringify(updatedHistory));
          }
        }

        console.log("Budget data loaded successfully");
      } catch (e) {
        console.log("Error loading budget data:", e);
      } finally {
        setIsLoaded(true);
      }
    };
    void load();
  }, []);

  const saveBudgetMutation = useMutation({
    mutationFn: async (amount: number) => {
      await AsyncStorage.setItem(BUDGET_KEY, JSON.stringify(amount));
      return amount;
    },
    onSuccess: (data) => {
      setWeeklyBudget(data);
      console.log("Budget saved:", data);
    },
  });

  const addPurchaseMutation = useMutation({
    mutationFn: async (purchase: Omit<BudgetPurchase, "id" | "weekStart">) => {
      const newPurchase: BudgetPurchase = {
        ...purchase,
        id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
        weekStart: getWeekStart(new Date(purchase.date)),
      };
      const updated = [newPurchase, ...purchases];
      await AsyncStorage.setItem(PURCHASES_KEY, JSON.stringify(updated));
      return updated;
    },
    onSuccess: (data) => {
      setPurchases(data);
      console.log("Purchase added, total:", data.length);
    },
  });

  const deletePurchaseMutation = useMutation({
    mutationFn: async (purchaseId: string) => {
      const updated = purchases.filter((p) => p.id !== purchaseId);
      await AsyncStorage.setItem(PURCHASES_KEY, JSON.stringify(updated));
      return updated;
    },
    onSuccess: (data) => {
      setPurchases(data);
      console.log("Purchase deleted");
    },
  });

  const updateBudget = useCallback(
    (amount: number) => {
      saveBudgetMutation.mutate(amount);
    },
    [saveBudgetMutation]
  );

  const addPurchase = useCallback(
    (purchase: Omit<BudgetPurchase, "id" | "weekStart">) => {
      addPurchaseMutation.mutate(purchase);
    },
    [addPurchaseMutation]
  );

  const deletePurchase = useCallback(
    (id: string) => {
      deletePurchaseMutation.mutate(id);
    },
    [deletePurchaseMutation]
  );

  const currentWeekPurchases = useMemo(
    () =>
      purchases
        .filter((p) => p.weekStart === currentWeekStart)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [purchases, currentWeekStart]
  );

  const totalSpent = useMemo(
    () => currentWeekPurchases.reduce((sum, p) => sum + p.amount, 0),
    [currentWeekPurchases]
  );

  const remaining = useMemo(() => weeklyBudget - totalSpent, [weeklyBudget, totalSpent]);

  const spentPercentage = useMemo(
    () => (weeklyBudget > 0 ? (totalSpent / weeklyBudget) * 100 : 0),
    [totalSpent, weeklyBudget]
  );

  const daysElapsed = useMemo(() => {
    const now = new Date();
    const weekStartDate = new Date(currentWeekStart + "T00:00:00");
    const diffMs = now.getTime() - weekStartDate.getTime();
    return Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  }, [currentWeekStart]);

  const dailyAverage = useMemo(
    () => (daysElapsed > 0 ? totalSpent / daysElapsed : 0),
    [totalSpent, daysElapsed]
  );

  const projectedTotal = useMemo(() => dailyAverage * 7, [dailyAverage]);

  const costPerMeal = useMemo(() => totalSpent / 21, [totalSpent]);

  const progressColor = useMemo(() => {
    if (spentPercentage > 100) return "#EF4444";
    if (spentPercentage > 85) return "#F97316";
    if (spentPercentage > 60) return "#F59E0B";
    return "#2dd4a8";
  }, [spentPercentage]);

  return useMemo(
    () => ({
      weeklyBudget,
      updateBudget,
      purchases: currentWeekPurchases,
      allPurchases: purchases,
      addPurchase,
      deletePurchase,
      weeklyHistory,
      totalSpent,
      remaining,
      spentPercentage,
      progressColor,
      dailyAverage,
      projectedTotal,
      costPerMeal,
      daysElapsed,
      currentWeekStart,
      currentWeekEnd,
      currentWeekRange,
      isLoaded,
      isAdding: addPurchaseMutation.isPending,
    }),
    [
      weeklyBudget,
      updateBudget,
      currentWeekPurchases,
      purchases,
      addPurchase,
      deletePurchase,
      weeklyHistory,
      totalSpent,
      remaining,
      spentPercentage,
      progressColor,
      dailyAverage,
      projectedTotal,
      costPerMeal,
      daysElapsed,
      currentWeekStart,
      currentWeekEnd,
      currentWeekRange,
      isLoaded,
      addPurchaseMutation.isPending,
    ]
  );
});
