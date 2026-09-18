// The Client Inquiry form as a browser sees it, read from the rendered page.
//
// Tests build each Client Inquiry they post from the form's own markup rather
// than a hard-coded list of field names, so a test POST is exactly what a
// browser with JavaScript disabled would send.

export interface RenderedForm {
	method: string;
	action: string;
	/** Every `name` on an input, select, or textarea, in document order. */
	fieldNames: string[];
	/** The form's markup, for field-level assertions. */
	html: string;
}

/** The one form on a page that posts a Client Inquiry. */
export function inquiryFormIn(page: string): RenderedForm {
	const forms = [...page.matchAll(/<form\b([^>]*)>([\s\S]*?)<\/form>/g)];
	if (forms.length !== 1) throw new Error(`Expected exactly one <form>, found ${forms.length}`);

	const [, attributes, body] = forms[0];
	return {
		method: attributeOf(attributes, 'method')?.toLowerCase() ?? 'get',
		action: attributeOf(attributes, 'action') ?? '',
		fieldNames: [...body.matchAll(/<(?:input|select|textarea)\b[^>]*\bname="([^"]+)"/g)].map((m) => m[1]),
		html: forms[0][0],
	};
}

function attributeOf(attributes: string, name: string): string | undefined {
	return new RegExp(`\\b${name}="([^"]*)"`).exec(attributes)?.[1];
}

/** The opening tag of the input or textarea carrying `name`. */
export function controlNamed(form: RenderedForm, name: string): string {
	const matched = new RegExp(`<(?:input|textarea)\\b[^>]*\\bname="${name}"[^>]*>`).exec(form.html);
	if (!matched) throw new Error(`No control named "${name}" in the form`);
	return matched[0];
}

/** What a control will submit as rendered: its `value`, or a textarea's text. */
export function renderedValue(form: RenderedForm, name: string): string {
	const textarea = new RegExp(`<textarea\\b[^>]*\\bname="${name}"[^>]*>([\\s\\S]*?)</textarea>`).exec(form.html);
	if (textarea) return textarea[1];
	return /\bvalue="([^"]*)"/.exec(controlNamed(form, name))?.[1] ?? '';
}
