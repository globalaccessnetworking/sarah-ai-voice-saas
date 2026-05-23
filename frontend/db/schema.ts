/**
 * Global Access AI Engine — Drizzle ORM Schema
 * Database: PostgreSQL (sovereign, local deployment)
 *
 * Run migrations:
 *   npx drizzle-kit generate
 *   npx drizzle-kit migrate
 */

import {
    pgTable,
    text,
    boolean,
    integer,
    numeric,
    jsonb,
    timestamp,
    index,
    varchar,
    uuid,
    serial,
} from "drizzle-orm/pg-core";

// ─── Agents ──────────────────────────────────────────────────────────────────
export const agents = pgTable(
    "agents",
    {
        // PK — generated in DB via DEFAULT 'agt_' || encode(gen_random_bytes(12),'hex')
        id: text("id").primaryKey(),

        // Identity
        name: text("name").notNull(),
        slug: text("slug").notNull().unique(),
        systemPrompt: text("system_prompt").notNull().default(""),
        initialGreeting: text("initial_greeting").default(""),
        knowledgeBase: text("knowledge_base").default(""),
        toolInstructions: text("tool_instructions").default(""),

        // Runtime status
        status: text("status").notNull().default("stopped"), // running | stopped | restarting

        // Pipeline mode
        pipelineMode: text("pipeline_mode").notNull().default("standard"), // standard | realtime

        // LLM config
        llmProvider: text("llm_provider").notNull().default("openai"),
        llmModel: text("llm_model").notNull().default("gpt-4o"),
        llmTemperature: numeric("llm_temperature", { precision: 4, scale: 2 }).notNull().default("0.8"),
        llmAzureDeployment: text("llm_azure_deployment"),

        // STT config
        sttProvider: text("stt_provider").notNull().default("deepgram"),
        sttModel: text("stt_model").notNull().default("nova-3-general"),
        sttLanguage: text("stt_language").notNull().default("en-US"),
        sttResponsiveness: numeric("stt_responsiveness", { precision: 3, scale: 2 }).notNull().default("0.6"),
        sttDetectLanguage: boolean("stt_detect_language").notNull().default(false),
        sttCustomVocab: text("stt_custom_vocab"),
        sttSmartFormatting: boolean("stt_smart_formatting").notNull().default(true),
        sttRemoveFillers: boolean("stt_remove_fillers").notNull().default(true),
        sttAzureDeployment: text("stt_azure_deployment"),

        // TTS config
        ttsProvider: text("tts_provider").notNull().default("cartesia"),
        ttsModel: text("tts_model").notNull().default("sonic-2"),
        ttsVoiceId: text("tts_voice_id"),
        ttsLanguage: text("tts_language").default("en-US"),
        ttsDictionaryId: text("tts_dictionary_id"),
        ttsSpeed: numeric("tts_speed", { precision: 4, scale: 2 }),
        elevenLabsStability: numeric("elevenlabs_stability", { precision: 4, scale: 2 }),
        elevenLabsSimilarity: numeric("elevenlabs_similarity", { precision: 4, scale: 2 }),
        ttsAzureDeployment: text("tts_azure_deployment"),

        // Realtime config (pipeline_mode = 'realtime')
        rtProvider: text("rt_provider").default("google"),
        rtModel: text("rt_model").default("gemini-2.5-flash-native-audio-preview-12-2025"),
        rtVoice: text("rt_voice").default("Puck"),
        rtLanguage: text("rt_language"),
        rtModalities: text("rt_modalities").notNull().default("text_audio"),
        rtProactivity: boolean("rt_proactivity").notNull().default(false),
        rtAffectiveDialog: boolean("rt_affective_dialog").notNull().default(false),
        rtNoiseReduction: boolean("rt_noise_reduction").notNull().default(false),
        rtThinkingBudget: text("rt_thinking_budget").default("auto"),
        rtMaxOutputTokens: integer("rt_max_output_tokens"),
        rtTopP: numeric("rt_top_p", { precision: 4, scale: 2 }),
        rtTemperature: numeric("rt_temperature", { precision: 4, scale: 2 }).default("0.8"),
        rtSpeed: numeric("rt_speed", { precision: 4, scale: 2 }),
        rtTurnDetection: text("rt_turn_detection"),
        rtTurnDetectionEagerness: text("rt_turn_detection_eagerness"),
        rtCtxCompressionEnabled: boolean("rt_ctx_compression_enabled").notNull().default(false),
        rtCtxCompressionTrigger: integer("rt_ctx_compression_trigger"),
        rtCtxCompressionTarget: integer("rt_ctx_compression_target"),
        rtAzureDeployment: text("rt_azure_deployment"),

        // Extension
        toolsConfig: jsonb("tools_config").notNull().default([]),
        extraConfig: jsonb("extra_config").notNull().default({}),

        // Outbound Robocall Config
        outboundGreetingText: text("outbound_greeting_text"),
        outboundGreetingWav: text("outbound_greeting_wav"),
        resolvedFarewellText: text("resolved_farewell_text"),
        resolvedFarewellWav: text("resolved_farewell_wav"),
        unresolvedFarewellText: text("unresolved_farewell_text"),
        unresolvedFarewellWav: text("unresolved_farewell_wav"),

        // Robocall Governance
        outboundBatchLimit: integer("outbound_batch_limit").default(5),
        outboundRetryInterval: integer("outbound_retry_interval").default(120),
        outboundMaxRetries: integer("outbound_max_retries").default(3),
        outboundAllowedStart: text("outbound_allowed_start").default("09:00"),
        outboundAllowedEnd: text("outbound_allowed_end").default("20:00"),
        isOutboundActive: boolean("is_outbound_active").default(false),
        bypassOperatingHours: boolean("bypass_operating_hours").default(false),
        outboundSttModel: text("outbound_stt_model").notNull().default("nova-2-general"),
        outboundLlmModel: text("outbound_llm_model").notNull().default("gpt-4o"),
        outboundLlmTemperature: numeric("outbound_llm_temperature", { precision: 4, scale: 2 }).notNull().default("0.5"),
        outboundTtsVoiceId: text("outbound_tts_voice_id").notNull().default("v_meklc281"),
        outboundTtsDictionaryId: text("outbound_tts_dictionary_id"),
        outboundWatchdogNudgeText: text("outbound_watchdog_nudge_text"),
        bypassOutboundDictionary: boolean("bypass_outbound_dictionary").notNull().default(false),
        
        // Eligibility Gating (Phase 18)
        eligibilityRules: jsonb("eligibility_rules").notNull().default({}),

        // Timestamps
        createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => [
        index("idx_agents_status").on(table.status),
        index("idx_agents_slug").on(table.slug),
        index("idx_agents_created_at").on(table.createdAt),
    ]
);

// ─── Call Logs ────────────────────────────────────────────────────────────────
export const callLogs = pgTable(
    "call_logs",
    {
        id: text("id").primaryKey(),
        agentId: text("agent_id").notNull().references(() => agents.id, { onDelete: "cascade" }),
        sessionId: text("session_id"),
        roomName: text("room_name"),
        direction: text("direction").notNull().default("inbound"),
        status: text("status").notNull().default("completed"),
        fromNumber: text("from_number"),
        toNumber: text("to_number"),
        transcript: jsonb("transcript").default([]),
        summary: text("summary"),
        recordingUrl: text("recording_url"),
        durationSeconds: integer("duration_seconds").default(0),
        duration: integer("duration").default(0),
        totalCost: numeric("total_cost", { precision: 10, scale: 2 }).default("0.00"),
        metadata: jsonb("metadata").default({}),
        startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
        endedAt: timestamp("ended_at", { withTimezone: true }),
        createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => [
        index("idx_call_logs_agent_id").on(table.agentId),
        index("idx_call_logs_started_at").on(table.startedAt.desc()),
    ]
);

// ─── System Settings ─────────────────────────────────────────────────────────
export const systemSettings = pgTable("system_settings", {
    id: varchar("id", { length: 50 }).primaryKey().default("global_config"),
    apiKeys: jsonb("api_keys").default({}),
    pricingConfig: jsonb("pricing_config").default({}),
    brandingConfig: jsonb("branding_config").default({}),
    storageConfig: jsonb("storage_config").default({}),
    emailConfig: jsonb("email_config").default({}),
    backupConfig: jsonb("backup_config").default({}),
    notesConfig: jsonb("notes_config").default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow()
});

// ── SIP Trunks ───────────────────────────────────────────────────────────────
export const sipTrunks = pgTable(
    "sip_trunks",
    {
        id: varchar("id", { length: 64 }).primaryKey(),
        type: varchar("type", { length: 32 }).notNull(), // 'inbound' or 'outbound'
        name: varchar("name", { length: 255 }).notNull(),
        numbers: jsonb("numbers").default([]),
        address: varchar("address", { length: 255 }),
        transport: varchar("transport", { length: 32 }).default("tcp"),
        allowedAddresses: jsonb("allowed_addresses").default([]),
        allowedNumbers: jsonb("allowed_numbers").default([]),
        authUsername: varchar("auth_username", { length: 255 }),
        authPassword: varchar("auth_password", { length: 255 }),
        metadata: jsonb("metadata").default({}),
        headers: jsonb("headers").default({}),
        headersToAttributes: jsonb("headers_to_attributes").default({}),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
    },
    (table) => [
        index("idx_sip_trunks_type").on(table.type),
        index("idx_sip_trunks_created_at").on(table.createdAt),
    ]
);

// ── Phone Numbers ────────────────────────────────────────────────────────────
export const phoneNumbers = pgTable(
    "phone_numbers",
    {
        id: varchar("id", { length: 64 }).primaryKey(),
        number: varchar("number", { length: 255 }).notNull().unique(),
        friendlyName: varchar("friendly_name", { length: 255 }),
        trunkId: varchar("trunk_id", { length: 64 })
            .notNull()
            .references(() => sipTrunks.id, { onDelete: "cascade" }),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
    },
    (table) => [
        index("idx_phone_numbers_trunk_id").on(table.trunkId),
    ]
);

// ── Dispatch Rules ───────────────────────────────────────────────────────────
export const dispatchRules = pgTable(
    "dispatch_rules",
    {
        id: varchar("id", { length: 64 }).primaryKey(),
        name: varchar("name", { length: 255 }),
        phoneNumberId: varchar("phone_number_id", { length: 64 })
            .notNull()
            .references(() => phoneNumbers.id, { onDelete: "cascade" }),
        agentId: text("agent_id")
            .notNull()
            .references(() => agents.id, { onDelete: "cascade" }),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
    },
    (table) => [
        index("idx_dispatch_rules_phone_number_id").on(table.phoneNumberId),
    ]
);

// ── Tools Registry ───────────────────────────────────────────────────────────
export const tools = pgTable(
    "tools",
    {
        id: varchar("id", { length: 64 }).primaryKey(),
        name: varchar("name", { length: 255 }).notNull(),
        description: text("description"),
        type: varchar("type", { length: 32 }).notNull().default("webhook"),
        endpointUrl: varchar("endpoint_url", { length: 2048 }),
        parametersSchema: jsonb("parameters_schema").default({}),
        enabled: boolean("enabled").notNull().default(true),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
    },
    (table) => [
        index("idx_tools_type").on(table.type),
    ]
);

// ── Agent Tools Mapping ──────────────────────────────────────────────────────
export const agentTools = pgTable(
    "agent_tools",
    {
        id: varchar("id", { length: 64 }).primaryKey(),
        agentId: text("agent_id")
            .notNull()
            .references(() => agents.id, { onDelete: "cascade" }),
        toolId: varchar("tool_id", { length: 64 })
            .notNull()
            .references(() => tools.id, { onDelete: "cascade" }),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    },
    (table) => [
        index("idx_agent_tools_agent_id").on(table.agentId),
        index("idx_agent_tools_tool_id").on(table.toolId),
    ]
);

// ── Recordings ───────────────────────────────────────────────────────────────
export const recordings = pgTable(
    "recordings",
    {
        id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
        filename: varchar("filename", { length: 512 }).notNull(),
        agentName: varchar("agent_name", { length: 255 }),
        roomName: varchar("room_name", { length: 255 }).notNull(),
        sizeBytes: integer("size_bytes").notNull().default(0),
        durationSeconds: integer("duration_seconds").notNull().default(0),
        storageLocation: varchar("storage_location", { length: 32 }).notNull().default("local"), // 'local', 's3', 'gcs'
        objectKey: varchar("object_key", { length: 1024 }),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    },
    (table) => [
        index("idx_recordings_room_name").on(table.roomName),
        index("idx_recordings_created_at").on(table.createdAt),
    ]
);

// ── Report Rules ─────────────────────────────────────────────────────────────
export const reportRules = pgTable(
    "report_rules",
    {
        id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
        name: varchar("name", { length: 255 }).notNull(),
        enabled: boolean("enabled").notNull().default(true),
        triggerType: varchar("trigger_type", { length: 32 }).notNull(), // 'post_call', 'post_analysis', 'scheduled'
        scheduleConfig: jsonb("schedule_config").default({}),
        agentFilter: jsonb("agent_filter").default([]),
        directionFilter: varchar("direction_filter", { length: 32 }).notNull().default("all"),
        recipients: jsonb("recipients").notNull().default([]),
        templateId: varchar("template_id", { length: 255 }),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
    },
    (table) => [
        index("idx_report_rules_trigger_type").on(table.triggerType),
    ]
);

// ── Report History ───────────────────────────────────────────────────────────
export const reportHistory = pgTable(
    "report_history",
    {
        id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
        ruleId: text("rule_id")
            .notNull()
            .references(() => reportRules.id, { onDelete: "cascade" }),
        status: varchar("status", { length: 32 }).notNull(), // 'sent', 'failed'
        errorMessage: text("error_message"),
        executedAt: timestamp("executed_at", { withTimezone: true }).defaultNow(),
    },
    (table) => [
        index("idx_report_history_rule_id").on(table.ruleId),
        index("idx_report_history_executed_at").on(table.executedAt.desc()),
    ]
);

// ── Knowledge Bases ──────────────────────────────────────────────────────────
export const knowledgeBases = pgTable(
    "knowledge_bases",
    {
        id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
        name: varchar("name", { length: 255 }).notNull(),
        description: text("description"),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
    }
);

// ── Documents ────────────────────────────────────────────────────────────────
export const documents = pgTable(
    "documents",
    {
        id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
        kbId: text("kb_id")
            .notNull()
            .references(() => knowledgeBases.id, { onDelete: "cascade" }),
        filename: varchar("filename", { length: 512 }).notNull(),
        fileType: varchar("file_type", { length: 128 }).notNull(),
        sizeBytes: integer("size_bytes").notNull().default(0),
        status: varchar("status", { length: 32 }).notNull().default("pending"), // 'pending', 'processing', 'embedded', 'failed'
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    },
    (table) => [
        index("idx_documents_kb_id").on(table.kbId),
    ]
);

// ── Web Chat Agents ────────────────────────────────────────────────────────────
export const webChatAgents = pgTable(
    "web_chat_agents",
    {
        id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
        name: varchar("name", { length: 255 }).notNull(),
        enabled: boolean("enabled").default(true),
        description: text("description"),
        llmProvider: varchar("llm_provider", { length: 64 }).notNull().default("openai"),
        llmModel: varchar("llm_model", { length: 128 }).notNull().default("gpt-4o-mini"),
        temperature: numeric("temperature", { precision: 3, scale: 2 }).default('0.70'),
        maxTokens: integer("max_tokens").default(1024),
        systemPrompt: text("system_prompt").notNull(),
        knowledgeBase: text("knowledge_base"),
        toolInstructions: text("tool_instructions"),
        widgetConfig: jsonb("widget_config").default({}),
        voiceEnabled: boolean("voice_enabled").default(false),
        voiceConfig: jsonb("voice_config").default({}),
        allowedOrigins: jsonb("allowed_origins").default([]),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
    }
);

// ── Campaigns ─────────────────────────────────────────────────────────────
export const campaigns = pgTable("campaigns", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    status: varchar("status", { length: 50 }).default("idle"),
    sipTrunkId: varchar("sip_trunk_id", { length: 64 }).references(() => sipTrunks.id),
    agentId: text("agent_id").references(() => agents.id),
    concurrency: integer("concurrency").default(1),
    callDelaySeconds: integer("call_delay_seconds").default(0),
    stats: jsonb("stats").default({ total: 0, completed: 0, failed: 0 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow()
});

export const campaignNumbers = pgTable("campaign_numbers", {
    id: uuid("id").primaryKey().defaultRandom(),
    campaignId: uuid("campaign_id").references(() => campaigns.id, { onDelete: 'cascade' }),
    phone: varchar("phone", { length: 50 }).notNull(),
    name: varchar("name", { length: 255 }),
    companyName: varchar("company_name", { length: 255 }),
    status: varchar("status", { length: 50 }).default("pending"),
    calledAt: timestamp("called_at", { withTimezone: true })
});

// ── Users & Audit Logs (Phase 15.5) ─────────────────────────────────────────
export const users = pgTable("users", {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    displayName: varchar("display_name", { length: 255 }).notNull(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    isActive: boolean("is_active").default(true),
    twoFactorSecret: varchar("two_factor_secret", { length: 255 }),
    twoFactorEnabled: boolean("two_factor_enabled").default(false),
    backupCodes: jsonb("backup_codes"),
    marginConfig: jsonb("margin_config"),
    monthlyMinutesQuota: integer("monthly_minutes_quota").default(0),
    assignedAgents: jsonb("assigned_agents"),
    assignedNumbers: jsonb("assigned_numbers"),
    permissions: jsonb("permissions"),
    resetToken: varchar("reset_token", { length: 255 }),
    resetTokenExpiry: timestamp("reset_token_expiry", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow()
});

export const auditLogs = pgTable("audit_logs", {
    id: uuid("id").primaryKey().defaultRandom(),
    timestamp: timestamp("timestamp", { withTimezone: true }).defaultNow().notNull(),
    userId: uuid("user_id").references(() => users.id, { onDelete: 'set null' }),
    userEmail: varchar("user_email", { length: 255 }).notNull(),
    action: varchar("action", { length: 100 }).notNull(),
    resourceType: varchar("resource_type", { length: 100 }),
    resourceId: varchar("resource_id", { length: 255 }),
    details: text("details"),
    ipAddress: varchar("ip_address", { length: 45 })
});

export const systemIntegrations = pgTable("system_integrations", {
    id: uuid("id").primaryKey().defaultRandom(),
    providerName: varchar("provider_name", { length: 50 }).notNull().unique(),
    apiKey: text("api_key"),
    configJson: jsonb("config_json").default({}),
    region: varchar("region", { length: 50 }),
    isActive: boolean("is_active").default(true).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
});

// ── Email & Notifications (Phase 1) ──────────────────────────────────────────
export const emailConfigurations = pgTable("email_configurations", {
    id: uuid("id").primaryKey().defaultRandom(),
    enableService: boolean("enable_service").notNull().default(false),
    provider: text("provider").notNull().default("SMTP"), // 'SMTP' | 'AWS_SES'
    smtpHost: text("smtp_host"),
    smtpPort: integer("smtp_port").notNull().default(587),
    username: text("username"),
    password: text("password"), // Note: Should be encrypted
    useTls: boolean("use_tls").notNull().default(true),
    fromEmail: text("from_email"),
    fromName: text("from_name"),
    replyToEmail: text("reply_to_email"),
    awsRegion: text("aws_region"),
    priority: integer("priority").notNull().default(1), // 1 = Primary, 2 = Failover, etc.
    healthStatus: text("health_status").notNull().default("HEALTHY"), // 'HEALTHY' | 'DEGRADED' | 'DOWN'
    lastCheckedAt: timestamp("last_checked_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});

export const emailTemplates = pgTable("email_templates", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    uniqueIdentifier: text("unique_identifier").notNull().unique(),
    type: text("type").notNull().default("SYSTEM"), // 'SYSTEM' | 'CUSTOM'
    subject: text("subject").notNull(),
    htmlContent: text("html_content").notNull(),
    expectedVariables: jsonb("expected_variables").notNull().default([]),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});

export const emailLogs = pgTable("email_logs", {
    id: uuid("id").primaryKey().defaultRandom(),
    timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
    recipient: text("recipient").notNull(),
    subject: text("subject").notNull(),
    templateType: text("template_type").notNull(), // name or identifier of the template
    status: text("status").notNull(), // 'SENT' | 'FAILED' | 'BOUNCED'
    errorMessage: text("error_message")
});

export const serviceAlertConfigurations = pgTable("service_alert_configurations", {
    id: uuid("id").primaryKey().defaultRandom(),
    enableAlerts: boolean("enable_alerts").notNull().default(false),
    recipientEmails: text("recipient_emails").notNull(), // Comma-separated
    monitoredServices: jsonb("monitored_services").notNull().default([]), // ['Agent Worker', 'LiveKit Server', etc.]
    alertCooldown: integer("alert_cooldown").notNull().default(30), // minutes
    checkInterval: integer("check_interval").notNull().default(60), // seconds
    slackWebhookUrl: text("slack_webhook_url"),
    cpuThreshold: integer("cpu_threshold").notNull().default(80),
    memoryThreshold: integer("memory_threshold").notNull().default(80),
    storageThreshold: integer("storage_threshold").notNull().default(90),
    enableSlack: boolean("enable_slack").notNull().default(false),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});

export const workspaceBranding = pgTable("workspace_branding", {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: text("workspace_id").notNull().unique(),
    companyName: text("company_name").notNull(),
    logoUrl: text("logo_url"),
    primaryColor: text("primary_color").notNull().default("#10b981"),
    accentColor: text("accent_color").notNull().default("#3b82f6"),
    supportEmail: text("support_email"),
    websiteUrl: text("website_url"),
    customDomain: text("custom_domain"),
    dkimStatus: text("dkim_status").notNull().default("PENDING"), // 'PENDING' | 'VERIFIED' | 'FAILED'
    spfStatus: text("spf_status").notNull().default("PENDING"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});

export const reportingConfiguration = pgTable("reporting_configuration", {
    id: serial("id").primaryKey(),
    enableDailySummary: boolean("enable_daily_summary").default(true),
    executionTime: varchar("execution_time", { length: 5 }).default("23:59"),
    timezone: varchar("timezone").default("UTC"),
    recipientEmails: text("recipient_emails"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow()
});

export const emailBrandingProfile = pgTable('email_branding_profile', {
    id: serial('id').primaryKey(),
    companyName: varchar('company_name', { length: 255 }).default('Global Access AI'),
    logoUrl: varchar('logo_url', { length: 1024 }),
    primaryColor: varchar('primary_color', { length: 7 }).default('#22c55e'),
    supportEmail: varchar('support_email', { length: 255 }),
    customDomain: varchar('custom_domain', { length: 255 }),
    isDomainVerified: boolean('is_domain_verified').default(false),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

// ─── Complaints (Citizen Registry) ───────────────────────────────────────────
export const complaints = pgTable("complaints", {
    id: serial("id").primaryKey(),
    ticket_id: text("ticket_id"),
    name: text("name"),
    phone: text("phone"),
    issue: text("issue"),
    district: text("district"),
    address: text("address"),
    landmark: text("landmark"),
    status: text("status").default("Pending"),
    priority: text("priority").default("Normal"),
    notes: text("notes"),
    sentiment: text("sentiment"),
    recording_id: text("recording_id"),
    room_name: text("room_name"),
    asteriskNumber: text("asterisk_number"),

    // Outbound Robocall Tracking
    outboundStatus: text("outbound_status").default("pending"),
    citizenFeedback: text("citizen_feedback"),
    outboundRetryCount: integer("outbound_retry_count").default(0),
    outboundSipCallId: text("outbound_sip_call_id"),
    outboundError: text("outbound_error"),
    lastCalledAt: timestamp("last_called_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ─── Knowledge Base (Sarah Policies) ──────────────────────────────────────────
export const knowledgeBase = pgTable("knowledge_base", {
    id: serial("id").primaryKey(),
    agentId: text("agent_id").references(() => agents.id, { onDelete: "cascade" }),
    category: text("category"),
    question: text("question"),
    answer: text("answer"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ─── Type Exports ─────────────────────────────────────────────────────────────
export type Agent = typeof agents.$inferSelect;
export type NewAgent = typeof agents.$inferInsert;
export type CallLog = typeof callLogs.$inferSelect;
export type SystemSetting = typeof systemSettings.$inferSelect;
export type SipTrunk = typeof sipTrunks.$inferSelect;
export type PhoneNumber = typeof phoneNumbers.$inferSelect;
export type DispatchRule = typeof dispatchRules.$inferSelect;
export type Tool = typeof tools.$inferSelect;
export type AgentTool = typeof agentTools.$inferSelect;
export type Recording = typeof recordings.$inferSelect;
export type ReportRule = typeof reportRules.$inferSelect;
export type ReportHistory = typeof reportHistory.$inferSelect;
export type KnowledgeBase = typeof knowledgeBases.$inferSelect;
export type Document = typeof documents.$inferSelect;
export type WebChatAgent = typeof webChatAgents.$inferSelect;
// ─── Knowledge Base ──────────────────────────────────────────────────────────
export const knowledgeBaseFiles = pgTable("knowledge_base_files", {
    id: text("id").primaryKey(),
    fileName: varchar("file_name", { length: 255 }).notNull(),
    fileSize: integer("file_size").notNull(),
    fileType: varchar("file_type", { length: 100 }).notNull(),
    status: varchar("status", { length: 50 }).notNull().default("Vectorizing"),
    vectorCount: integer("vector_count").default(0),
    uploadedAt: timestamp("uploaded_at", { withTimezone: true }).notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
export type SystemIntegration = typeof systemIntegrations.$inferSelect;
export type NewSystemIntegration = typeof systemIntegrations.$inferInsert;
export type EmailConfiguration = typeof emailConfigurations.$inferSelect;
export type NewEmailConfiguration = typeof emailConfigurations.$inferInsert;
export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type NewEmailTemplate = typeof emailTemplates.$inferInsert;
export type EmailLog = typeof emailLogs.$inferSelect;
export type NewEmailLog = typeof emailLogs.$inferInsert;
export type ServiceAlertConfiguration = typeof serviceAlertConfigurations.$inferSelect;
export type NewServiceAlertConfiguration = typeof serviceAlertConfigurations.$inferInsert;
export type WorkspaceBranding = typeof workspaceBranding.$inferSelect;
export type NewWorkspaceBranding = typeof workspaceBranding.$inferInsert;
export type ReportingConfiguration = typeof reportingConfiguration.$inferSelect;
export type NewReportingConfiguration = typeof reportingConfiguration.$inferInsert;
export type EmailBrandingProfile = typeof emailBrandingProfile.$inferSelect;
export type NewEmailBrandingProfile = typeof emailBrandingProfile.$inferInsert;
export type KnowledgeBaseFile = typeof knowledgeBaseFiles.$inferSelect;
export type NewKnowledgeBaseFile = typeof knowledgeBaseFiles.$inferInsert;
export type Complaint = typeof complaints.$inferSelect;
export type NewComplaint = typeof complaints.$inferInsert;
export type KnowledgeBaseSource = typeof knowledgeBase.$inferSelect;
export type NewKnowledgeBaseSource = typeof knowledgeBase.$inferInsert;

// ─── TTS Custom Vocabulary (For Auto-Sync to Phrase Replacements) ───────────────
export const ttsCustomVocabulary = pgTable("tts_custom_vocabulary", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    agentId: text("agent_id").references(() => agents.id, { onDelete: "cascade" }),
    phrase: varchar("phrase", { length: 50 }).notNull(),
    replacement: varchar("replacement", { length: 50 }).notNull(),
    isSynced: boolean("is_synced").default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export type TtsCustomVocabulary = typeof ttsCustomVocabulary.$inferSelect;
export type NewTtsCustomVocabulary = typeof ttsCustomVocabulary.$inferInsert;

// --- SMS Intelligent Notification System (Phase 1) ---------------------------

export const districts = pgTable("districts", {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const supervisorRegistry = pgTable("supervisor_registry", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    phoneNumber: text("phone_number").notNull(), // E.164 format (+923...)
    districtId: integer("district_id").references(() => districts.id, { onDelete: "cascade" }),
    isPrimary: boolean("is_primary").default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (table) => [
    index("idx_supervisor_phone").on(table.phoneNumber),
    index("idx_supervisor_district").on(table.districtId),
]);

export const smsConfigurations = pgTable("sms_configurations", {
    id: uuid("id").primaryKey().defaultRandom(),
    providerName: text("provider_name").notNull(), // e.g., 'Sendpk'
    apiUrl: text("api_url").notNull(),
    senderId: text("sender_id").notNull(), // Masking / Brand Name
    apiParams: jsonb("api_params").default({}), // For dynamic provider keys (username, pass, etc.)
    isActive: boolean("is_active").default(false),
    creditThreshold: integer("credit_threshold").default(500), // PKR threshold for alerts
    lowCreditAlertSent: boolean("low_credit_alert_sent").default(false),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const smsTemplates = pgTable("sms_templates", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    triggerType: text("trigger_type").notNull().unique(), // 'complaint_submitted', 'ticket_reopened'
    content: text("content").notNull(), // Supports {{ticket_id}}
    useUnicode: boolean("use_unicode").default(false), // Required for Urdu
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const smsLogs = pgTable("sms_logs", {
    id: uuid("id").primaryKey().defaultRandom(),
    recipient: text("recipient").notNull(),
    ticketId: text("ticket_id"),
    content: text("content").notNull(),
    status: text("status").notNull(), // 'SENT', 'FAILED', 'PENDING'
    providerResponse: jsonb("provider_response"), // Raw API response for debugging
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const smsJobs = pgTable("sms_jobs", {
    id: uuid("id").primaryKey().defaultRandom(),
    recipient: text("recipient").notNull(),
    ticketId: text("ticket_id"),
    content: text("content").notNull(),
    triggerType: text("trigger_type"),
    attemptCount: integer("attempt_count").default(0),
    maxRetries: integer("max_retries").default(3),
    nextAttemptAt: timestamp("next_attempt_at", { withTimezone: true }).defaultNow(),
    status: text("status").default("PENDING"), // PENDING, PROCESSING, COMPLETED, FAILED
    lastError: text("last_error"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export type District = typeof districts.$inferSelect;
export type NewDistrict = typeof districts.$inferInsert;
export type Supervisor = typeof supervisorRegistry.$inferSelect;
export type NewSupervisor = typeof supervisorRegistry.$inferInsert;
export type SmsConfiguration = typeof smsConfigurations.$inferSelect;
export type NewSmsConfiguration = typeof smsConfigurations.$inferInsert;
export type SmsTemplate = typeof smsTemplates.$inferSelect;
export type NewSmsTemplate = typeof smsTemplates.$inferInsert;
export type SmsLog = typeof smsLogs.$inferSelect;
export type NewSmsLog = typeof smsLogs.$inferInsert;
export type SmsJob = typeof smsJobs.$inferSelect;
export type NewSmsJob = typeof smsJobs.$inferInsert;
