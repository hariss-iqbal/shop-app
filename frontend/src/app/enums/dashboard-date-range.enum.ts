/**
 * Dashboard date range enumeration - frontend only
 * Preset options for dashboard date range selector
 */
export enum DashboardDateRange {
  TODAY = 'today',
  LAST_7_DAYS = 'last_7_days',
  THIS_MONTH = 'this_month',
  LAST_30_DAYS = 'last_30_days',
  THIS_QUARTER = 'this_quarter',
  THIS_YEAR = 'this_year',
  ALL_TIME = 'all_time',
  CUSTOM = 'custom'
}

export const DashboardDateRangeLabels: Record<DashboardDateRange, string> = {
  [DashboardDateRange.TODAY]: 'Today',
  [DashboardDateRange.LAST_7_DAYS]: 'Last 7 Days',
  [DashboardDateRange.THIS_MONTH]: 'This Month',
  [DashboardDateRange.LAST_30_DAYS]: 'Last 30 Days',
  [DashboardDateRange.THIS_QUARTER]: 'This Quarter',
  [DashboardDateRange.THIS_YEAR]: 'This Year',
  [DashboardDateRange.ALL_TIME]: 'All Time',
  [DashboardDateRange.CUSTOM]: 'Custom Range'
};
