const monthYear = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' });

export function formatDateRange(data: { startDate: Date; endDate?: Date }): string {
	if (!data.endDate) return monthYear.format(data.startDate);
	return `${monthYear.format(data.startDate)} – ${monthYear.format(data.endDate)}`;
}

// A frontmatter date is parsed as UTC midnight, so it must be formatted in UTC
// too — otherwise a build machine west of Greenwich prints the day before.
const longDate = new Intl.DateTimeFormat('en-US', { dateStyle: 'long', timeZone: 'UTC' });

export function formatPostDate(date: Date): string {
	return longDate.format(date);
}
