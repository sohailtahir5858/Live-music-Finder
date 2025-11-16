/**
 * @utils filterHelpers
 * @description Helper functions for filter calculations (date ranges, time periods)
 */

export interface TimeRange {
  label: string;
  value: string;
  timeRange?: { startHour: number; endHour: number };
  dateRange?: { from: string; to: string };
}

export interface DateRangePreset {
  label: string;
  value: string;
  getDateRange: () => { from: string; to: string };
}
export function formatDate(date = new Date(), format = "YYYY-MM-DD") {
  const d = new Date(date);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yyyy = d.getFullYear();

  if (format === "YYYY-MM-DD") {
    return `${yyyy}-${mm}-${dd}`;
  }

  return `${mm}-${dd}-${yyyy}`; // default
}
/**
 * Time filter options with hour ranges for API filtering
 */
export const TIME_FILTERS: TimeRange[] = [
  {
    label: 'All Day',
    value: 'all-day',
    timeRange: { startHour: 0, endHour: 23 },
    dateRange:{from:formatDate(new Date()),to:formatDate(new Date()).split('T')[0]+'T23:59:59'}
  },
  {
    label: 'Morning',
    value: 'morning',
    timeRange: { startHour: 6, endHour: 11 },
    dateRange:{from:formatDate(new Date())+'T06:00:00',to:formatDate(new Date())+'T12:00:00'}
  },
  {
    label: 'Afternoon',
    value: 'afternoon',
    timeRange: { startHour: 12, endHour: 16 },
    dateRange:{from:formatDate(new Date())+'T12:00:00',to:formatDate(new Date())+'T17:00:00'}
  },
  {
    label: 'Evening',
    value: 'evening',
    timeRange: { startHour: 17, endHour: 20 },
    dateRange:{from:formatDate(new Date())+'T17:00:00',to:formatDate(new Date())+'T21:00:00'}
  },
  {
    label: 'Night',
    value: 'night',
    timeRange: { startHour: 21, endHour: 23 },
    dateRange:{from:formatDate(new Date())+'T21:00:00',to:formatDate(new Date())+'T23:59:59'}
  },
];

/**
 * Date preset helpers
 */
export const getDatePresets = (): DateRangePreset[] => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const getISODate = (date: Date) => date.toISOString().split('T')[0];

  return [
    {
      label: 'Today',
      value: 'today',
      getDateRange: () => ({
        from: getISODate(today),
        to: getISODate(today),
      }),
    },
    {
      label: 'Tomorrow',
      value: 'tomorrow',
      getDateRange: () => {
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return { from: getISODate(tomorrow), to: getISODate(tomorrow) };
      },
    },
    {
      label: 'Next 7 Days',
      value: 'next-7',
      getDateRange: () => {
        const next7 = new Date(today);
        next7.setDate(next7.getDate() + 7);
        return { from: getISODate(today), to: getISODate(next7) };
      },
    },
    {
      label: 'Next 30 Days',
      value: 'next-30',
      getDateRange: () => {
        const next30 = new Date(today);
        next30.setDate(next30.getDate() + 30);
        return { from: getISODate(today), to: getISODate(next30) };
      },
    },
    {
      label: 'This Month',
      value: 'this-month',
      getDateRange: () => {
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        return { from: getISODate(today), to: getISODate(lastDay) };
      },
    },
    {
      label: 'Next Month',
      value: 'next-month',
      getDateRange: () => {
        const nextMonthFirst = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        const nextMonthLast = new Date(today.getFullYear(), today.getMonth() + 2, 0);
        return { from: getISODate(nextMonthFirst), to: getISODate(nextMonthLast) };
      },
    },
  ];
};

/**
 * Convert time filter to start/end time strings for API
 */
export const getTimeFilterStrings = (timeFilter: string): { startTime: string; endTime: string } | null => {
  const filter = TIME_FILTERS.find(tf => tf.value === timeFilter);
  if (!filter || !filter.timeRange) return null;

  const { startHour, endHour } = filter.timeRange;
  return {
    startTime: `${String(startHour).padStart(2, '0')}:00:00`,
    endTime: `${String(endHour).padStart(2, '0')}:59:59`,
  };
};
