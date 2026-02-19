// Zod validation schemas for all entities
// Used for both client and server-side validation

import { z } from "zod";

// ==================== ENUM CONSTANTS ====================
// These match the string values used in the database

export const UserRole = {
    SUPER_ADMIN: "SUPER_ADMIN",
    ADMIN: "ADMIN",
    EDITOR: "EDITOR",
} as const;

export const UserStatus = {
    ACTIVE: "ACTIVE",
    INACTIVE: "INACTIVE",
    SUSPENDED: "SUSPENDED",
} as const;

export const ContentStatus = {
    DRAFT: "DRAFT",
    PUBLISHED: "PUBLISHED",
    ARCHIVED: "ARCHIVED",
} as const;

export const LanguageLevel = {
    A1: "A1",
    A2: "A2",
    B1: "B1",
    B2: "B2",
    C1: "C1",
    C2: "C2",
    NATIVE: "NATIVE",
} as const;

export const NoticeType = {
    INFO: "INFO",
    WARNING: "WARNING",
    CRITICAL: "CRITICAL",
} as const;

export const DisplayMode = {
    BANNER: "BANNER",
    MODAL: "MODAL",
} as const;

// Type exports for the enums
export type UserRole = (typeof UserRole)[keyof typeof UserRole];
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];
export type ContentStatus = (typeof ContentStatus)[keyof typeof ContentStatus];
export type LanguageLevel = (typeof LanguageLevel)[keyof typeof LanguageLevel];
export type NoticeType = (typeof NoticeType)[keyof typeof NoticeType];
export type DisplayMode = (typeof DisplayMode)[keyof typeof DisplayMode];

// ==================== USER SCHEMAS ====================

export const loginSchema = z.object({
    username: z.string().min(1, "Username richiesto"),
    password: z.string().min(1, "Password richiesta"),
});

export const createUserSchema = z.object({
    username: z
        .string()
        .min(3, "Username deve avere almeno 3 caratteri")
        .max(50, "Username troppo lungo")
        .regex(/^[a-zA-Z0-9_]+$/, "Username può contenere solo lettere, numeri e underscore"),
    email: z.string().email("Email non valida"),
    displayName: z.string().min(1, "Nome visualizzato richiesto").max(100),
    password: z
        .string()
        .min(8, "Password deve avere almeno 8 caratteri")
        .regex(/[A-Z]/, "Password deve contenere almeno una maiuscola")
        .regex(/[a-z]/, "Password deve contenere almeno una minuscola")
        .regex(/[0-9]/, "Password deve contenere almeno un numero"),
    role: z.enum(["SUPER_ADMIN", "ADMIN", "EDITOR"]),
    mustResetPassword: z.boolean().default(false),
});
export type CreateUserFormInput = z.input<typeof createUserSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export const updateUserSchema = z.object({
    email: z.string().email("Email non valida").optional(),
    displayName: z.string().min(1).max(100).optional(),
    role: z.enum(["SUPER_ADMIN", "ADMIN", "EDITOR"]).optional(),
    status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).optional(),
});

export const changePasswordSchema = z
    .object({
        currentPassword: z.string().min(1, "Password attuale richiesta"),
        newPassword: z
            .string()
            .min(8, "Password deve avere almeno 8 caratteri")
            .regex(/[A-Z]/, "Password deve contenere almeno una maiuscola")
            .regex(/[a-z]/, "Password deve contenere almeno una minuscola")
            .regex(/[0-9]/, "Password deve contenere almeno un numero"),
        confirmPassword: z.string(),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: "Le password non coincidono",
        path: ["confirmPassword"],
    });

export const resetPasswordSchema = z.object({
    newPassword: z
        .string()
        .min(8, "Password deve avere almeno 8 caratteri")
        .regex(/[A-Z]/, "Password deve contenere almeno una maiuscola")
        .regex(/[a-z]/, "Password deve contenere almeno una minuscola")
        .regex(/[0-9]/, "Password deve contenere almeno un numero"),
});

// ==================== PROJECT SCHEMAS ====================

export const projectSchema = z.object({
    slug: z
        .string()
        .min(1, "Slug richiesto")
        .max(100)
        .regex(/^[a-z0-9-]+$/, "Slug può contenere solo lettere minuscole, numeri e trattini"),
    title: z.string().min(1, "Titolo richiesto").max(200),
    mainLink: z.string().url("URL non valido"),
    description: z.string().optional(),
    tags: z.array(z.string()).default([]),
    techStack: z.array(z.string()).default([]),
    images: z.array(z.string()).default([]),
    coverImage: z.string().optional().nullable(),
    repoLink: z.string().url("URL non valido").optional().nullable().or(z.literal("")),
    roleActivities: z.string().optional(),
    results: z.string().optional(),
    status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
    featured: z.boolean().default(false),
    order: z.number().int().default(0),
    startDate: z.string().optional().nullable(),
    endDate: z.string().optional().nullable(),
});

export const projectUpdateSchema = projectSchema.partial();

// ==================== CERTIFICATION SCHEMAS ====================

export const certificationSchema = z.object({
    title: z.string().min(1, "Titolo richiesto").max(200),
    issuer: z.string().min(1, "Ente rilasciante richiesto").max(200),
    issuedAt: z.string().min(1, "Data conseguimento richiesta"),
    expiresAt: z.string().optional().nullable(),
    credentialId: z.string().optional().nullable(),
    verificationLink: z.string().url("URL non valido").optional().nullable().or(z.literal("")),
    description: z.string().optional(),
    skills: z.array(z.string()).default([]),
    attachmentPath: z.string().optional().nullable(),
    status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
    order: z.number().int().default(0),
});

export const certificationUpdateSchema = certificationSchema.partial();

// ==================== VOLUNTEERING SCHEMAS ====================

export const volunteeringSchema = z.object({
    organization: z.string().min(1, "Organizzazione richiesta").max(200),
    role: z.string().min(1, "Ruolo richiesto").max(200),
    startDate: z.string().min(1, "Data inizio richiesta"),
    endDate: z.string().optional().nullable(),
    isCurrent: z.boolean().default(false),
    location: z.string().optional().nullable(),
    description: z.string().optional(),
    impact: z.string().optional(),
    link: z.string().url("URL non valido").optional().nullable().or(z.literal("")),
    tags: z.array(z.string()).default([]),
    status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
    order: z.number().int().default(0),
});

export const volunteeringUpdateSchema = volunteeringSchema.partial();

// ==================== AWARD SCHEMAS ====================

export const awardSchema = z.object({
    title: z.string().min(1, "Titolo richiesto").max(200),
    issuer: z.string().min(1, "Ente richiesto").max(200),
    awardedAt: z.string().min(1, "Data richiesta"),
    description: z.string().optional(),
    link: z.string().url("URL non valido").optional().nullable().or(z.literal("")),
    attachmentPath: z.string().optional().nullable(),
    tags: z.array(z.string()).default([]),
    status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
    order: z.number().int().default(0),
});

export const awardUpdateSchema = awardSchema.partial();

// ==================== LANGUAGE SCHEMAS ====================

export const languageSchema = z.object({
    name: z.string().min(1, "Nome lingua richiesto").max(100),
    level: z.string().min(1, "Livello richiesto").max(100),
    notes: z.string().optional().nullable().or(z.literal("")),
    certificationId: z.string().uuid().optional().nullable().or(z.literal("")),
    order: z.number().int().default(0),
    visible: z.boolean().default(true),
});

export const languageUpdateSchema = languageSchema.partial();

// ==================== GLOBAL NOTICE SCHEMA ====================

export const globalNoticeSchema = z.object({
    title: z.string().min(1, "Titolo richiesto").max(200),
    message: z.string().min(1, "Messaggio richiesto"),
    type: z.enum(["INFO", "WARNING", "CRITICAL"]).default("INFO"),
    active: z.boolean().default(false),
    displayMode: z.enum(["BANNER", "MODAL"]).default("BANNER"),
    requiresAck: z.boolean().default(false),
    startAt: z.string().optional().nullable(),
    endAt: z.string().optional().nullable(),
    ackExpiryDays: z.number().int().min(1).max(365).default(7),
});

// ==================== MAINTENANCE SCHEMA ====================

export const maintenanceSchema = z.object({
    enabled: z.boolean().default(false),
    title: z.string().default("Manutenzione in corso"),
    message: z.string().default(""),
});

// ==================== COMMON SCHEMAS ====================

export const paginationSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().optional(),
    status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export const idSchema = z.object({
    id: z.string().uuid("ID non valido"),
});

// Type exports for schemas
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
// NOTE: for React Hook Form + zodResolver we want the *input* type (z.input)
// so defaults/optional fields don't cause type mismatches.
export type ProjectInput = z.input<typeof projectSchema>;
export type CertificationInput = z.input<typeof certificationSchema>;
export type VolunteeringInput = z.input<typeof volunteeringSchema>;
export type AwardInput = z.input<typeof awardSchema>;
export type LanguageInput = z.input<typeof languageSchema>;
export type GlobalNoticeInput = z.input<typeof globalNoticeSchema>;
export type MaintenanceInput = z.input<typeof maintenanceSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
