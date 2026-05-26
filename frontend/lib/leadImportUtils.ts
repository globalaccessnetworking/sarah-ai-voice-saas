/**
 * leadImportUtils.ts
 * Pure TypeScript utilities for CSV/Excel lead import wizard.
 * No React, no side effects — safe to import server-side or client-side.
 *
 * Key design:
 *   - normalizeHeader() converts any column name to a safe snake_case key
 *   - buildLeadData() stores BOTH the normalized original key AND the canonical
 *     mapped key in lead_data so {{company}} and {{company_name}} both work
 *   - Dual-key example:
 *       Header "Company" → normalized "company" → mapped "company_name"
 *       lead_data = { company: "Acme", company_name: "Acme" }
 */

// ─── Header Normalization ─────────────────────────────────────────────────────

/**
 * Convert any column header to a safe snake_case variable name.
 * Rules:
 *   - lowercase + trim
 *   - spaces, dashes, slashes, dots → underscore
 *   - strip unsafe characters (keep alphanumeric + underscore)
 *   - collapse consecutive underscores
 *   - strip leading/trailing underscores
 *   - never return empty string (falls back to "col")
 */
export function normalizeHeader(raw: string): string {
    let s = raw.trim().toLowerCase();
    // Replace common separators with underscore
    s = s.replace(/[\s\-\/\\.]+/g, '_');
    // Remove any character that is not alphanumeric or underscore
    s = s.replace(/[^a-z0-9_]/g, '');
    // Collapse consecutive underscores
    s = s.replace(/_+/g, '_');
    // Strip leading / trailing underscores
    s = s.replace(/^_+|_+$/g, '');
    return s || 'col';
}

/**
 * Given a list of raw headers, return a map of rawHeader → normalized key.
 * If two headers normalize to the same key, suffix the later ones with _2, _3 …
 */
export function buildNormalizedHeaderMap(headers: string[]): Record<string, string> {
    const result: Record<string, string> = {};
    const seen: Record<string, number> = {};

    for (const h of headers) {
        const base = normalizeHeader(h);
        if (seen[base] === undefined) {
            seen[base] = 0;
            result[h] = base;
        } else {
            seen[base] += 1;
            result[h] = `${base}_${seen[base] + 1}`;
        }
    }
    return result;
}

// ─── Field Aliases ────────────────────────────────────────────────────────────

export type StandardField =
    | 'phone'
    | 'name'
    | 'company_name'
    | 'business_nature'
    | 'pain_point'
    | 'website'
    | 'email'
    | 'linkedin'
    | 'address'
    | 'industry'
    | 'designation'
    | 'number_of_employees'
    | 'gmb_reviews';

/** Human-readable label for each standard field */
export const STANDARD_FIELD_LABELS: Record<StandardField, string> = {
    phone: 'Phone (Required)',
    name: 'Contact Name',
    company_name: 'Company Name',
    business_nature: 'Business Nature / Type',
    pain_point: 'Pain Point / Problem',
    website: 'Website',
    email: 'Email Address',
    linkedin: 'LinkedIn URL',
    address: 'Address',
    industry: 'Industry',
    designation: 'Designation / Title',
    number_of_employees: 'Number of Employees',
    gmb_reviews: 'GMB / Google Reviews',
};

/**
 * Alias lists for auto-detection.
 * Each entry is normalized via normalizeHeader() at runtime before comparison.
 */
export const FIELD_ALIASES: Record<StandardField, string[]> = {
    phone: [
        'phone', 'mobile', 'cell', 'contact number', 'phone number',
        'mobile number', 'telephone', 'number', 'contact_number',
        'phone_number', 'mobile_number', 'tel', 'cellphone', 'handphone',
        'whatsapp', 'contact', 'mob',
    ],
    name: [
        'name', 'full name', 'full_name', 'contact name', 'lead name',
        'owner name', 'customer name', 'person name', 'client name',
        'contact_name', 'lead_name', 'owner_name', 'customer_name',
        'first name', 'firstname', 'first_name',
    ],
    company_name: [
        'company', 'company name', 'company_name', 'business', 'business name',
        'business_name', 'organization', 'organisation', 'account name',
        'account_name', 'firm', 'brand',
    ],
    business_nature: [
        'business type', 'business nature', 'business_type', 'business_nature',
        'niche', 'category', 'industry type', 'industry_type', 'vertical',
        'sector', 'type of business', 'type_of_business',
    ],
    pain_point: [
        'pain point', 'pain_point', 'problem', 'issue', 'challenge',
        'need', 'requirement', 'pain', 'concern', 'objective',
    ],
    website: [
        'website', 'website address', 'website_address', 'domain', 'url',
        'company website', 'company_website', 'web', 'web address',
        'web_address', 'site',
    ],
    email: [
        'email', 'email address', 'email_address', 'owner email', 'owner_email',
        'contact email', 'contact_email', 'business email', 'business_email',
        'mail', 'e-mail', 'e_mail',
    ],
    linkedin: [
        'linkedin', 'linkedin url', 'linkedin_url', 'linkedin profile',
        'linkedin_profile', 'company linkedin', 'company_linkedin',
        'linkedin link', 'li',
    ],
    address: [
        'address', 'street address', 'street_address', 'location',
        'office address', 'office_address', 'company address', 'company_address',
    ],
    industry: [
        'industry', 'sector', 'market', 'field', 'domain',
    ],
    designation: [
        'designation', 'title', 'job title', 'job_title', 'role',
        'owner title', 'owner_title', 'position', 'job_role', 'post',
    ],
    number_of_employees: [
        'employees', 'employee count', 'number of employees', 'number_of_employees',
        'team size', 'team_size', 'staff count', 'staff_count', 'headcount',
        'staff', 'workforce',
    ],
    gmb_reviews: [
        'gmb reviews', 'gmb_reviews', 'google reviews', 'google_reviews',
        'google rating', 'google_rating', 'rating', 'reviews', 'star rating',
        'star_rating', 'stars', 'review count', 'review_count',
    ],
};

/** Pre-compute normalized alias → field for O(1) lookup */
const _aliasLookup: Record<string, StandardField> = {};
for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
    for (const alias of aliases) {
        _aliasLookup[normalizeHeader(alias)] = field as StandardField;
    }
}

/**
 * Auto-detect which standard field each raw header likely maps to.
 * Returns { rawHeader: StandardField | null }
 * null means "store as-is in lead_data" (no standard mapping detected).
 */
export function detectFieldMapping(headers: string[]): Record<string, StandardField | null> {
    const result: Record<string, StandardField | null> = {};
    for (const h of headers) {
        const normalized = normalizeHeader(h);
        result[h] = _aliasLookup[normalized] ?? null;
    }
    return result;
}

// ─── Phone Normalization ──────────────────────────────────────────────────────

export interface PhoneResult {
    original: string;
    normalized: string | null; // digits only; null if invalid
    valid: boolean;
    warning?: string;
}

/**
 * Normalize a phone number to digits only.
 * - Strip +, spaces, dashes, parentheses, dots
 * - Valid range: 7–15 digits (ITU E.164 compatible)
 * - Returns null + valid=false if it cannot be parsed or out of range
 */
export function normalizePhone(raw: string): PhoneResult {
    const original = raw;
    const digits = String(raw).replace(/[\s\+\-\.\(\)]/g, '').replace(/\D/g, '');

    if (!digits) {
        return { original, normalized: null, valid: false, warning: 'No digits found' };
    }
    if (digits.length < 7) {
        return { original, normalized: digits, valid: false, warning: `Too short (${digits.length} digits)` };
    }
    if (digits.length > 15) {
        return { original, normalized: digits, valid: false, warning: `Too long (${digits.length} digits)` };
    }
    return { original, normalized: digits, valid: true };
}

// ─── Lead Data Builder ────────────────────────────────────────────────────────

export interface ParsedLead {
    /** Normalized phone (digits only) */
    phone: string;
    /** Contact name (for campaign_numbers.name) */
    name: string;
    /** Company name (for campaign_numbers.company_name) */
    company_name: string;
    /**
     * ALL normalized key-value pairs from the row.
     * Includes BOTH:
     *   - normalized original column key  (e.g. "company" from "Company")
     *   - canonical mapped key            (e.g. "company_name")
     * This ensures {{company}} and {{company_name}} both resolve in templates.
     */
    lead_data: Record<string, string>;
    /** Original raw row — used for "download invalid rows" */
    raw: Record<string, string>;
    _valid: boolean;
    _validationError?: string;
    _isDuplicate?: boolean;
}

/**
 * Build a ParsedLead from a single CSV/XLSX row.
 *
 * Dual-key logic:
 *   If a column header "Company" normalizes to "company" and is mapped to
 *   "company_name", then lead_data gets BOTH:
 *     { company: "Acme", company_name: "Acme" }
 *
 * Mapping examples:
 *   "Full Name"      → full_name   + name
 *   "Mobile"         → mobile      + phone
 *   "Company"        → company     + company_name
 *   "Business Type"  → business_type + business_nature
 *   "Problem"        → problem     + pain_point
 *   "Google Rating"  → google_rating + gmb_reviews
 *   "Owner Title"    → owner_title + designation
 *   "Employees"      → employees   + number_of_employees
 */
export function buildLeadData(
    row: Record<string, string>,
    mapping: Record<string, StandardField | null>,
    normalizedHeaderMap: Record<string, string>
): ParsedLead {
    const lead_data: Record<string, string> = {};

    let rawPhone = '';
    let rawName = '';
    let rawCompany = '';

    for (const [rawHeader, value] of Object.entries(row)) {
        const val = String(value ?? '').trim();
        const normalizedKey = normalizedHeaderMap[rawHeader] ?? normalizeHeader(rawHeader);
        const mappedField = mapping[rawHeader] ?? null;

        // 1. Always store normalized original key
        if (normalizedKey) {
            lead_data[normalizedKey] = val;
        }

        // 2. If mapped to a standard field AND the key differs, also store canonical key
        if (mappedField && mappedField !== normalizedKey) {
            lead_data[mappedField] = val;
        }

        // 3. Extract first-class fields
        if (mappedField === 'phone' && !rawPhone) rawPhone = val;
        if (mappedField === 'name' && !rawName) rawName = val;
        if (mappedField === 'company_name' && !rawCompany) rawCompany = val;
    }

    // Phone validation
    const phoneResult = normalizePhone(rawPhone);

    const lead: ParsedLead = {
        phone: phoneResult.normalized ?? rawPhone,
        name: rawName,
        company_name: rawCompany,
        lead_data,
        raw: row,
        _valid: phoneResult.valid,
        _validationError: phoneResult.valid ? undefined : (phoneResult.warning ?? 'Invalid phone'),
    };

    return lead;
}

/**
 * Process a full list of raw rows into ParsedLeads.
 * Also marks internal duplicates within the uploaded file.
 */
export function processRows(
    rows: Record<string, string>[],
    mapping: Record<string, StandardField | null>,
    normalizedHeaderMap: Record<string, string>
): ParsedLead[] {
    const seenPhones = new Set<string>();
    return rows.map((row) => {
        const lead = buildLeadData(row, mapping, normalizedHeaderMap);
        if (lead._valid && lead.phone) {
            if (seenPhones.has(lead.phone)) {
                lead._valid = false;
                lead._isDuplicate = true;
                lead._validationError = `Duplicate phone within file (${lead.phone})`;
            } else {
                seenPhones.add(lead.phone);
            }
        }
        return lead;
    });
}

// ─── Greeting Preview ─────────────────────────────────────────────────────────

export interface GreetingToken {
    type: 'text' | 'resolved' | 'missing';
    value: string;
    variable?: string;
}

/**
 * Render a greeting template for a lead, returning a list of tokens.
 * Token types:
 *   'text'     — literal text
 *   'resolved' — {{variable}} successfully replaced
 *   'missing'  — {{variable}} not found in lead_data (shown in amber)
 */
export function tokenizeGreeting(template: string, lead: ParsedLead): GreetingToken[] {
    const tokens: GreetingToken[] = [];
    const regex = /\{\{(\w+)\}\}/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(template)) !== null) {
        // Push text before this variable
        if (match.index > lastIndex) {
            tokens.push({ type: 'text', value: template.slice(lastIndex, match.index) });
        }

        const varName = match[1];
        const resolved = lead.lead_data[varName];

        if (resolved !== undefined && resolved !== '') {
            tokens.push({ type: 'resolved', value: resolved, variable: varName });
        } else {
            tokens.push({ type: 'missing', value: `{{${varName}}}`, variable: varName });
        }

        lastIndex = match.index + match[0].length;
    }

    // Push remaining text
    if (lastIndex < template.length) {
        tokens.push({ type: 'text', value: template.slice(lastIndex) });
    }

    return tokens;
}

/**
 * Render a greeting template to a plain string (for logging / non-React use).
 * Missing variables are left as {{variable}}.
 */
export function renderGreetingPreview(template: string, lead: ParsedLead): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, varName) => {
        const val = lead.lead_data[varName];
        return val !== undefined && val !== '' ? val : `{{${varName}}}`;
    });
}

// ─── CSV Export (for download invalid rows) ───────────────────────────────────

/**
 * Serialize an array of raw row objects to a CSV string (RFC 4180).
 */
export function serializeToCSV(rows: Record<string, string>[]): string {
    if (rows.length === 0) return '';
    const headers = Object.keys(rows[0]);

    const escapeCell = (cell: string) => {
        const s = String(cell ?? '');
        if (s.includes(',') || s.includes('"') || s.includes('\n')) {
            return `"${s.replace(/"/g, '""')}"`;
        }
        return s;
    };

    const lines = [
        headers.map(escapeCell).join(','),
        ...rows.map((row) => headers.map((h) => escapeCell(row[h] ?? '')).join(',')),
    ];
    return lines.join('\r\n');
}

/**
 * Trigger a client-side CSV download.
 * Only call this in a browser context.
 */
export function downloadCSV(rows: Record<string, string>[], filename: string): void {
    const csv = serializeToCSV(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
