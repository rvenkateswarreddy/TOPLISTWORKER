import config from './config';

export function validateHexColor(color) {
	return /^#([0-9a-f]{3}){1,2}$/i.test(color);
}

export function validateLimit(limit) {
	const num = parseInt(limit, 10);
	return !isNaN(num) && num > 0 && num <= 50;
}

export function validateToplistType(type) {
	return config.toplistTypes.includes(type);
}

export function validateOutputFormat(format) {
	return config.outputFormats.includes(format);
}

export function validateLayout(layout) {
	return config.layoutTypes.includes(layout);
}

export function getCacheKey(type, limit, destinationThemeId, cityCodeDep) {
	return `toplist:${type}:${limit}:${destinationThemeId || ''}:${cityCodeDep || ''}`;
}

export async function hashString(input) {
	const encoder = new TextEncoder();
	const data = encoder.encode(input);
	const hashBuffer = await crypto.subtle.digest('SHA-256', data);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
