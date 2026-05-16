import { Expense, PersonalExpense, SavingsGoal, RecurringTemplate } from "./store";
import { isWithinInterval, startOfMonth, endOfMonth, startOfQuarter, subMonths, parseISO, startOfDay, endOfDay } from "date-fns";

export type TimeRange = "this-month" | "last-month" | "this-quarter" | "all-time" | "custom";

export function getFilteredData(
  personal: PersonalExpense[],
  expenses: Expense[],
  userId: string,
  range: TimeRange,
  context: "all" | "personal" | "group",
  savingsGoals: SavingsGoal[] = [],
  recurringTemplates: RecurringTemplate[] = [],
  customStart?: string,
  customEnd?: string,
  selectedDate?: string
) {
  const now = new Date();
  let interval: { start: Date; end: Date };

  if (selectedDate) {
    // If a specific date is selected via heatmap, we focus exclusively on it
    const targetDate = parseISO(selectedDate);
    interval = { start: startOfDay(targetDate), end: endOfDay(targetDate) };
  } else {
    switch (range) {
      case "this-month":
        interval = { start: startOfMonth(now), end: endOfMonth(now) };
        break;
      case "last-month":
        const lastMonth = subMonths(now, 1);
        interval = { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
        break;
      case "this-quarter":
        interval = { start: startOfQuarter(now), end: now };
        break;
      case "custom":
        interval = { 
          start: customStart ? parseISO(customStart) : startOfMonth(now), 
          end: customEnd ? parseISO(customEnd) : now 
        };
        break;
      default:
        interval = { start: new Date(0), end: now };
    }
  }

  const isAllTime = range === "all-time" && !selectedDate;

  // Flatten personal expenses to include sub-entries if they exist
  const flattenedPersonal = personal.flatMap(e => {
    if (e.subEntries && e.subEntries.length > 0) {
      return e.subEntries.map(s => ({
        ...e,
        id: `${e.id}-${s.id}`,
        amount: s.amount,
        date: s.date,
        description: (s.note === "Initial entry" ? e.description : s.note) || e.description,
        isSubEntry: true,
        parentId: e.id
      }));
    }
    return [{ ...e, isSubEntry: false }];
  });

  const filteredPersonal = (context === "all" || context === "personal") 
    ? flattenedPersonal.filter(e => {
        return isAllTime || isWithinInterval(parseISO(e.date), interval);
      })
    : [];

  const filteredGroups = (context === "all" || context === "group")
    ? expenses.filter(e => {
        return isAllTime || isWithinInterval(parseISO(e.date), interval);
      })
    : [];

  // Transform group expenses to user's share
  const groupShares = filteredGroups.map(e => ({
    id: e.id,
    description: e.description,
    amount: e.shares[userId] || 0,
    date: e.date,
    category: e.category,
    isGroup: true,
    groupName: e.groupId 
  }));

  const allExpenses = [
    ...filteredPersonal.map(e => ({ ...e, isGroup: false })),
    ...groupShares
  ];

  const totalSpend = allExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Group by category
  const byCategory = allExpenses.reduce((acc, e) => {
    const cat = e.category || "Other";
    acc[cat] = (acc[cat] || 0) + e.amount;
    return acc;
  }, {} as Record<string, number>);

  const categoryData = Object.entries(byCategory)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // Daily Trends (Time Series)
  const byDate = allExpenses.reduce((acc, e) => {
    const d = e.date;
    acc[d] = (acc[d] || 0) + e.amount;
    return acc;
  }, {} as Record<string, number>);

  const dailyTrends = Object.entries(byDate)
    .map(([date, amount]) => ({ date, amount }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Merchant Aggregation (Top Brands)
  const byMerchant = allExpenses.reduce((acc, e) => {
    const desc = e.description;
    acc[desc] = (acc[desc] || 0) + e.amount;
    return acc;
  }, {} as Record<string, number>);

  const merchantData = Object.entries(byMerchant)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // Savings Progress
  const savingsTotal = savingsGoals.reduce((sum, g) => sum + g.currentAmount, 0);
  const savingsTarget = savingsGoals.reduce((sum, g) => sum + g.targetAmount, 0);
  const savingsProgress = savingsTarget > 0 ? (savingsTotal / savingsTarget) * 100 : 0;

  // Recurring Forecast
  const recurringForecast = recurringTemplates
    .filter(t => t.isActive)
    .reduce((sum, t) => sum + (t.data.amount || 0), 0);

  // --- Phase 4: Comparative Insights ---
  const lastMonthInterval = { start: startOfMonth(subMonths(now, 1)), end: endOfMonth(subMonths(now, 1)) };
  
  const lastMonthPersonal = personal.filter(e => isWithinInterval(parseISO(e.date), lastMonthInterval));
  const lastMonthGroupShares = expenses.filter(e => isWithinInterval(parseISO(e.date), lastMonthInterval))
    .map(e => e.shares[userId] || 0);
  
  const lastMonthTotal = [...lastMonthPersonal.map(e => e.amount), ...lastMonthGroupShares]
    .reduce((sum, a) => sum + a, 0);

  const spendingChange = lastMonthTotal > 0 ? ((totalSpend - lastMonthTotal) / lastMonthTotal) * 100 : 0;

  // Predict budget bust date
  const dayOfMonth = now.getDate();
  const dailyAverage = totalSpend / dayOfMonth;
  
  return {
    allExpenses,
    totalSpend,
    categoryData,
    dailyTrends,
    merchantData,
    savingsTotal,
    savingsTarget,
    savingsProgress,
    recurringForecast,
    lastMonthTotal,
    spendingChange,
    dailyAverage,
    count: allExpenses.length
  };
}
