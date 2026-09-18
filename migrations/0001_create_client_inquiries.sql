-- A Client Inquiry: a message from a Prospective Client sent through the
-- site, asking about paid work (CONTEXT.md). Stored before any notification
-- is attempted, so a failed notification can never cost an inquiry
-- (docs/adr/0001-client-inquiry-pipeline.md).
CREATE TABLE client_inquiries (
	id INTEGER PRIMARY KEY,
	-- ISO 8601, UTC.
	submitted_at TEXT NOT NULL,
	name TEXT NOT NULL,
	email TEXT NOT NULL,
	-- NULL when the Prospective Client left it blank.
	organization TEXT,
	message TEXT NOT NULL,
	-- Nothing sends a notification yet (issue #11), so every row starts
	-- pending; `failed` marks one that needs retrying or noticing by hand.
	notification_status TEXT NOT NULL DEFAULT 'pending'
		CHECK (notification_status IN ('pending', 'sent', 'failed'))
);
