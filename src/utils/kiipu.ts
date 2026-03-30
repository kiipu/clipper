import {
	ClipPayload,
	KiipuCreatePostRequest,
	KiipuEnvironment,
	KiipuSettings,
	SaveResult,
} from '../types/types';

declare const __KIIPU_DEFAULT_ENV__: 'production' | 'development';

export const KIIPU_BASE_URLS: Record<'production' | 'development', string> = {
	production: 'https://api.kiipu.com',
	development: 'http://localhost:8787'
};

const MAX_TEXT_LENGTH = 5000;
const CLIPPED_SUFFIX = '\n\n[Clipped by Chrome extension]';

export function getDefaultKiipuEnvironment(): 'production' | 'development' {
	try {
		return __KIIPU_DEFAULT_ENV__;
	} catch {
		return 'production';
	}
}

export function resolveKiipuBaseUrl(settings: KiipuSettings): string {
	if (settings.environment === 'custom') {
		return settings.baseUrl.trim();
	}
	return KIIPU_BASE_URLS[settings.environment];
}

export function generateRequestId(): string {
	if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
		return crypto.randomUUID();
	}
	return `req_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function createTraceId(tabId?: number): string {
	return `chrome-clipper:${tabId ?? 'unknown'}:${Date.now()}`;
}

export function createSourceMessageId(url: string, tabId?: number): string {
	let hash = 5381;
	const input = `${tabId ?? 'unknown'}:${url}`;
	for (let i = 0; i < input.length; i++) {
		hash = ((hash << 5) + hash) + input.charCodeAt(i);
		hash |= 0;
	}
	return `clip_${Math.abs(hash)}`;
}

function ensureSourcePrefix(text: string, url: string): string {
	const trimmed = text.trim();
	if (!trimmed) {
		return `Source: ${url}`;
	}
	if (trimmed.includes(url)) {
		return trimmed;
	}
	return `Source: ${url}\n\n${trimmed}`;
}

export function clipKiipuText(text: string, url: string): string {
	const withSource = ensureSourcePrefix(text, url);
	if (withSource.length <= MAX_TEXT_LENGTH) {
		return withSource;
	}
	const maxBaseLength = MAX_TEXT_LENGTH - CLIPPED_SUFFIX.length;
	return `${withSource.slice(0, maxBaseLength)}${CLIPPED_SUFFIX}`;
}

export function normalizeTags(tags: string[] | undefined): string[] | undefined {
	if (!tags?.length) return undefined;
	const seen = new Set<string>();
	const normalized = tags
		.map(tag => tag.trim())
		.filter(Boolean)
		.map(tag => tag.slice(0, 32))
		.filter(tag => {
			if (seen.has(tag.toLowerCase())) return false;
			seen.add(tag.toLowerCase());
			return true;
		})
		.slice(0, 8);
	return normalized.length ? normalized : undefined;
}

export function mapClipPayloadToKiipuRequest(
	payload: ClipPayload,
	settings: KiipuSettings,
	options: { tabId?: number; requestId?: string; traceId?: string } = {}
): KiipuCreatePostRequest {
	const requestId = options.requestId || generateRequestId();
	const traceId = options.traceId || createTraceId(options.tabId);

	return {
		requestId,
		traceId,
		requestedAt: payload.createdAt,
		rawText: clipKiipuText(payload.rawText, payload.url),
		finalText: clipKiipuText(payload.fullContent, payload.url),
		sourceType: 'skill_command',
		visibility: settings.visibility,
		title: payload.title.trim().slice(0, 120) || null,
		tags: normalizeTags(payload.tags),
		sourceMessageId: createSourceMessageId(payload.url, options.tabId)
	};
}

export function getKiipuErrorMessage(result: SaveResult): string {
	switch (result.errorCode) {
		case 'unauthorized':
			return 'Kiipu API key is missing, invalid, or revoked.';
		case 'bad_request':
			return 'Kiipu rejected this clip because the request body is invalid.';
		case 'not_found':
			return 'Kiipu endpoint was not found for the current environment.';
		case 'conflict':
			return 'Kiipu rejected this clip because of a conflicting state.';
		case 'server_error':
			return 'Kiipu returned a server error. Please try again.';
		case 'network_error':
			return 'Unable to reach the Kiipu API for the current environment.';
		case 'timeout':
			return 'Kiipu request timed out.';
		case 'missing_config':
			return 'Kiipu is not configured yet.';
		default:
			return result.errorMessage || 'Failed to save to Kiipu.';
	}
}
