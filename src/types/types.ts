export interface Template {
	id: string;
	name: string;
	behavior: 'create' | 'append-specific' | 'append-daily' | 'prepend-specific' | 'prepend-daily' | 'overwrite';
	noteNameFormat: string;
	path: string;
	noteContentFormat: string;
	properties: Property[];
	triggers?: string[];
	vault?: string;
	context?: string;
}

export interface Property {
	id?: string;
	name: string;
	value: string;
	type?: string;
}

export interface ExtractedContent {
	[key: string]: string;
}

export type FilterFunction = (value: string, param?: string) => string | any[];

export interface PromptVariable {
	key: string;
	prompt: string;
	filters?: string;
}

export interface PropertyType {
	name: string;
	type: string;
	defaultValue?: string;
}

export interface Provider {
	id: string;
	name: string;
	baseUrl: string;
	apiKey: string;
	apiKeyRequired?: boolean;
	presetId?: string;
}

export interface Rating {
	rating: number;
	date: string;
}

export type SaveBehavior = 'addToObsidian' | 'addToKiipu' | 'saveFile' | 'copyToClipboard';
export type SaveTarget = 'obsidian' | 'kiipu' | 'file' | 'clipboard';
export type KiipuEnvironment = 'production' | 'development' | 'custom';
export type KiipuVisibility = 'public' | 'unlisted' | 'private';

export interface KiipuSettings {
	environment: KiipuEnvironment;
	baseUrl: string;
	apiKey: string;
	visibility: KiipuVisibility;
	enableTagMapping: boolean;
	validateBeforeSave: boolean;
}

export interface ReaderSettings {
	fontSize: number;
	lineHeight: number;
	maxWidth: number;
	theme: 'default' | 'flexoki';
	themeMode: 'auto' | 'light' | 'dark';
}

export interface Settings {
	vaults: string[];
	showMoreActionsButton: boolean;
	betaFeatures: boolean;
	legacyMode: boolean;
	silentOpen: boolean;
	openBehavior: 'popup' | 'embedded';
	highlighterEnabled: boolean;
	alwaysShowHighlights: boolean;
	highlightBehavior: string;
	interpreterModel?: string;
	models: ModelConfig[];
	providers: Provider[];
	interpreterEnabled: boolean;
	interpreterAutoRun: boolean;
	defaultPromptContext: string;
	propertyTypes: PropertyType[];
	readerSettings: ReaderSettings;
	stats: {
		addToObsidian: number;
		addToKiipu: number;
		saveFile: number;
		copyToClipboard: number;
		share: number;
	};
	history: HistoryEntry[];
	ratings: Rating[];
	saveBehavior: SaveBehavior;
	defaultSaveTarget: SaveBehavior;
	kiipu: KiipuSettings;
}

export interface ModelConfig {
	id: string;
	providerId: string;
	providerModelId: string;
	name: string;
	enabled: boolean;
}

export interface HistoryEntry {
	datetime: string;
	url: string;
	action: 'addToObsidian' | 'addToKiipu' | 'saveFile' | 'copyToClipboard' | 'share';
	title?: string;
	vault?: string;
	path?: string;
	target?: SaveTarget;
	requestId?: string;
	postId?: string;
}

export interface ConversationMessage {
	author: string;
	content: string;
	timestamp?: string;
	metadata?: Record<string, any>;
}

export interface ConversationMetadata {
	title?: string;
	description?: string;
	site: string;
	url: string;
	messageCount: number;
	startTime?: string;
	endTime?: string;
}

export interface Footnote {
	url: string;
	text: string;
}

export interface ClipPayload {
	title: string;
	url: string;
	rawText: string;
	frontmatter: string;
	content: string;
	fullContent: string;
	path: string;
	vault?: string;
	tags?: string[];
	createdAt: string;
	templateId?: string;
	templateName?: string;
	metadata: Record<string, unknown>;
}

export interface KiipuCreatePostRequest {
	requestId: string;
	traceId?: string;
	requestedAt: string;
	rawText: string;
	finalText?: string;
	sourceType: 'skill_command' | 'manual' | 'imported';
	visibility: KiipuVisibility;
	title?: string | null;
	tags?: string[];
	sourceMessageId?: string;
}

export interface KiipuCreatePostResponse {
	ok: boolean;
	requestId: string;
	data: {
		id: string;
		userId: string;
		sourceType: string;
		rawText: string;
		finalText: string;
		title?: string | null;
		visibility: KiipuVisibility;
		status: string;
		tags?: { tagName: string }[];
		createdAt: string;
		updatedAt: string;
	};
}

export interface KiipuValidateKeyResponse {
	success: boolean;
	data: {
		userId: string;
		username: string;
		displayName: string;
		keyPrefix: string;
	};
}

export interface SaveResult {
	ok: boolean;
	requestId?: string;
	postId?: string;
	createdAt?: string;
	errorCode?: string;
	errorMessage?: string;
}
