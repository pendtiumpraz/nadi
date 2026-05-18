import { getDB } from "@/lib/db";

export interface PolicyProductSection {
    heading: string;
    placeholder: string;
}

export interface PolicyProductTypeRow {
    key: string;
    label: string;
    short_description: string;
    word_count_min: number;
    word_count_max: number | null;
    page_length: string;
    tone: string;
    primary_research_note: string;
    sections: PolicyProductSection[] | unknown;
    legacy_category: string;
    display_order: number;
    is_archived: boolean;
    created_at: string | Date;
    updated_at: string | Date;
}

export interface PolicyProductTypeDTO {
    key: string;
    label: string;
    shortDescription: string;
    wordCount: { min: number; max: number | null };
    pageLength: string;
    tone: string;
    primaryResearchNote: string;
    sections: PolicyProductSection[];
    legacyCategory: string;
    displayOrder: number;
    isArchived: boolean;
}

function parseSections(value: unknown): PolicyProductSection[] {
    if (Array.isArray(value)) return value as PolicyProductSection[];
    if (typeof value === "string") {
        try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? (parsed as PolicyProductSection[]) : [];
        } catch {
            return [];
        }
    }
    return [];
}

function rowToDTO(row: PolicyProductTypeRow): PolicyProductTypeDTO {
    return {
        key: row.key,
        label: row.label,
        shortDescription: row.short_description || "",
        wordCount: { min: row.word_count_min ?? 0, max: row.word_count_max ?? null },
        pageLength: row.page_length || "",
        tone: row.tone || "",
        primaryResearchNote: row.primary_research_note || "",
        sections: parseSections(row.sections),
        legacyCategory: row.legacy_category || "",
        displayOrder: row.display_order ?? 0,
        isArchived: !!row.is_archived,
    };
}

export async function listPolicyProductTypes(opts: { includeArchived?: boolean } = {}): Promise<PolicyProductTypeDTO[]> {
    const sql = getDB();
    const rows = opts.includeArchived
        ? ((await sql`SELECT * FROM policy_product_types ORDER BY display_order, key`) as unknown as PolicyProductTypeRow[])
        : ((await sql`SELECT * FROM policy_product_types WHERE is_archived = false ORDER BY display_order, key`) as unknown as PolicyProductTypeRow[]);
    return rows.map(rowToDTO);
}

export async function getPolicyProductTypeByKey(key: string): Promise<PolicyProductTypeDTO | null> {
    const sql = getDB();
    const rows = (await sql`SELECT * FROM policy_product_types WHERE key = ${key} LIMIT 1`) as unknown as PolicyProductTypeRow[];
    if (rows.length === 0) return null;
    return rowToDTO(rows[0]);
}

export interface PolicyProductTypeInput {
    key: string;
    label: string;
    shortDescription?: string;
    wordCount?: { min: number; max: number | null };
    pageLength?: string;
    tone?: string;
    primaryResearchNote?: string;
    sections?: PolicyProductSection[];
    legacyCategory?: string;
    displayOrder?: number;
}

function slugify(text: string): string {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");
}

export async function createPolicyProductType(input: PolicyProductTypeInput): Promise<PolicyProductTypeDTO> {
    const sql = getDB();
    const key = slugify(input.key || input.label);
    if (!key) throw new Error("Key or label is required.");
    if (!input.label) throw new Error("Label is required.");
    const clash = await sql`SELECT 1 FROM policy_product_types WHERE key = ${key} LIMIT 1`;
    if (clash.length > 0) throw new Error(`Type with key '${key}' already exists.`);

    const sectionsJson = JSON.stringify(input.sections || []);
    await sql`
        INSERT INTO policy_product_types (
            key, label, short_description,
            word_count_min, word_count_max,
            page_length, tone, primary_research_note,
            sections, legacy_category, display_order
        ) VALUES (
            ${key},
            ${input.label},
            ${input.shortDescription || ""},
            ${input.wordCount?.min ?? 0},
            ${input.wordCount?.max ?? null},
            ${input.pageLength || ""},
            ${input.tone || ""},
            ${input.primaryResearchNote || ""},
            ${sectionsJson},
            ${input.legacyCategory || ""},
            ${input.displayOrder ?? 999}
        )
    `;
    const created = await getPolicyProductTypeByKey(key);
    if (!created) throw new Error("Failed to load created row.");
    return created;
}

export async function updatePolicyProductType(key: string, patch: Partial<PolicyProductTypeInput> & { isArchived?: boolean }): Promise<PolicyProductTypeDTO> {
    const sql = getDB();
    const existing = await getPolicyProductTypeByKey(key);
    if (!existing) throw new Error("Type not found.");

    const next: PolicyProductTypeDTO = {
        ...existing,
        label: patch.label ?? existing.label,
        shortDescription: patch.shortDescription ?? existing.shortDescription,
        wordCount: patch.wordCount ?? existing.wordCount,
        pageLength: patch.pageLength ?? existing.pageLength,
        tone: patch.tone ?? existing.tone,
        primaryResearchNote: patch.primaryResearchNote ?? existing.primaryResearchNote,
        sections: patch.sections ?? existing.sections,
        legacyCategory: patch.legacyCategory ?? existing.legacyCategory,
        displayOrder: patch.displayOrder ?? existing.displayOrder,
        isArchived: patch.isArchived ?? existing.isArchived,
    };

    await sql`
        UPDATE policy_product_types SET
            label = ${next.label},
            short_description = ${next.shortDescription},
            word_count_min = ${next.wordCount.min},
            word_count_max = ${next.wordCount.max},
            page_length = ${next.pageLength},
            tone = ${next.tone},
            primary_research_note = ${next.primaryResearchNote},
            sections = ${JSON.stringify(next.sections)},
            legacy_category = ${next.legacyCategory},
            display_order = ${next.displayOrder},
            is_archived = ${next.isArchived},
            updated_at = NOW()
        WHERE key = ${key}
    `;

    return next;
}

export async function deletePolicyProductType(key: string): Promise<void> {
    const sql = getDB();
    // Refuse to hard-delete if articles still reference this type — admins
    // should archive instead so existing rows keep their label.
    const inUse = await sql`SELECT 1 FROM articles WHERE policy_product_type = ${key} LIMIT 1`;
    if (inUse.length > 0) {
        throw new Error("This type is in use by at least one article. Archive it instead.");
    }
    await sql`DELETE FROM policy_product_types WHERE key = ${key}`;
}
