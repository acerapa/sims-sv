import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { createReportDoc, loadLogoDataUrl } from '../src/lib/utils/pdf';

// The real shipping asset doubles as the fixture: pinning jsPDF's support for this
// *progressive* JPEG is the risk flagged in ai-docs/print-headers-logo-spec.md.
const logoBuffer = readFileSync('static/ramtech-logo.jpg');

function outputBytes(doc: { output: () => string }): number {
	return (doc.output('arraybuffer') as ArrayBuffer).byteLength;
}

// jsPDF 4 removed getText() — pull rendered strings out of the raw content stream
// (same approach as test/categories-printable.spec.ts).
function textIn(doc: { output: () => string }): string {
	const content = doc.output('arraybuffer') as ArrayBuffer;
	const text = new TextDecoder('latin1').decode(new Uint8Array(content));
	const parts: string[] = [];
	const re = /\(((?:\\.|[^()\\])*)\)\s*Tj/g;
	let m: RegExpExecArray | null;
	while ((m = re.exec(text))) parts.push(m[1]);
	return parts.join('\n');
}

describe('createReportDoc — logo letterhead (D2/D3/D4)', () => {
	it('embeds the real progressive-JPEG logo and still renders the company header', async () => {
		const logoData = logoBuffer.toString('base64');
		const withLogo = (await createReportDoc({ title: 'Probe Report', logoData })).doc;
		const noLogo = (await createReportDoc({ title: 'Probe Report' })).doc;
		// embedded image is stored as (near-)raw JPEG data in the file VFS,
		// so its presence shows up as ~logo-size of extra output bytes
		expect(outputBytes(withLogo) - outputBytes(noLogo)).toBeGreaterThan(40_000);
		const text = textIn(withLogo);
		expect(text).toContain('RAM TECH VENTURES INC.');
		expect(text).toContain('BARTOLOME BLDG. MAGSAYSAY ST.');
		expect(text).toContain('Probe Report');
	});

	it('renders the legacy logo-less header when no logo is available (Node path)', async () => {
		const doc = (await createReportDoc({ title: 'Probe Report' })).doc;
		expect(outputBytes(doc)).toBeLessThan(20_000); // text-only document, no embedded image
		expect(textIn(doc)).toContain('RAM TECH VENTURES INC.');
	});

	it('still produces a valid document when the logo data is unusable (D4 degradation)', async () => {
		const doc = (await createReportDoc({
			title: 'Probe Report',
			logoData: 'data:image/jpeg;base64,AAAA'
		})).doc;
		expect(textIn(doc)).toContain('RAM TECH VENTURES INC.');
		expect(textIn(doc)).toContain('Probe Report');
	});
});

describe('loadLogoDataUrl — Node contract', () => {
	it('resolves undefined in plain Node without touching fetch', async () => {
		expect(await loadLogoDataUrl()).toBeUndefined();
	});

	it('turns the fetched logo into a data-URL in a browser-like environment', async () => {
		const originals = {
			window: globalThis.window,
			fetch: globalThis.fetch,
			FileReader: globalThis.FileReader
		};
		globalThis.window = {};
		globalThis.fetch = async () => ({ ok: true, blob: async () => logoBuffer });
		// FileReader doesn't exist in Node — stub the one method loadLogoDataUrl uses
		(globalThis as Record<string, unknown>).FileReader = class FakeReader {
			onload: (() => void) | undefined;
			onerror: ((e: unknown) => void) | undefined;
			result: string | undefined;
			readAsDataURL = () => {
				this.result = 'data:application/octet-stream;base64,' + logoBuffer.toString('base64');
				queueMicrotask(() => this.onload?.());
			};
		};
		try {
			const dataUrl = await loadLogoDataUrl();
			expect(dataUrl).toMatch(/^data:.*;base64,/);
		}
		finally {
			globalThis.window = originals.window;
			globalThis.fetch = originals.fetch;
			(globalThis as Record<string, unknown>).FileReader = originals.FileReader;
		}
	});
});
