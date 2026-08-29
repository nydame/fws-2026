const monthYear = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' });

export function formatDateRange(data: { startDate: Date; endDate?: Date }): string {
	if (!data.endDate) return monthYear.format(data.startDate);
	return `${monthYear.format(data.startDate)} – ${monthYear.format(data.endDate)}`;
}
