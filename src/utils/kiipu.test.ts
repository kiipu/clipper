import { describe, expect, it } from 'vitest';
import { clipKiipuText, mapClipPayloadToKiipuRequest, resolveKiipuBaseUrl } from './kiipu';
import { ClipPayload, KiipuSettings } from '../types/types';

const kiipuSettings: KiipuSettings = {
	environment: 'production',
	baseUrl: 'https://api.kiipu.com',
	apiKey: 'cpk_test',
	visibility: 'private',
	enableTagMapping: true,
	validateBeforeSave: false
};

const payload: ClipPayload = {
	title: 'Example title',
	url: 'https://example.com/article',
	rawText: 'raw body',
	frontmatter: '---\nsource: https://example.com/article\n---\n',
	content: '# Hello',
	fullContent: '---\nsource: https://example.com/article\n---\n# Hello',
	path: 'Articles',
	vault: 'Vault',
	tags: ['tag-1', 'tag-2'],
	createdAt: '2026-03-30T10:00:00.000Z',
	templateId: 'template-1',
	templateName: 'Default',
	metadata: {
		author: 'Alice'
	}
};

describe('kiipu utils', () => {
	it('resolves environment base URLs', () => {
		expect(resolveKiipuBaseUrl(kiipuSettings)).toBe('https://api.kiipu.com');
		expect(resolveKiipuBaseUrl({
			...kiipuSettings,
			environment: 'development'
		})).toBe('http://localhost:8787');
		expect(resolveKiipuBaseUrl({
			...kiipuSettings,
			environment: 'custom',
			baseUrl: 'http://127.0.0.1:8787'
		})).toBe('http://127.0.0.1:8787');
	});

	it('maps clip payloads to the Kiipu request shape', () => {
		const request = mapClipPayloadToKiipuRequest(payload, kiipuSettings, {
			tabId: 12,
			requestId: 'req_123',
			traceId: 'trace_123'
		});

		expect(request.requestId).toBe('req_123');
		expect(request.traceId).toBe('trace_123');
		expect(request.rawText).toContain('Source: https://example.com/article');
		expect(request.finalText).toContain('https://example.com/article');
		expect(request.visibility).toBe('private');
		expect(request.tags).toEqual(['tag-1', 'tag-2']);
		expect(request.title).toBe('Example title');
	});

	it('clips text to Kiipu length limits', () => {
		const longText = `Body ${'a'.repeat(6000)}`;
		const clipped = clipKiipuText(longText, 'https://example.com/article');

		expect(clipped.length).toBeLessThanOrEqual(5000);
		expect(clipped).toContain('[Clipped by Chrome extension]');
		expect(clipped.startsWith('Source: https://example.com/article')).toBe(true);
	});
});
