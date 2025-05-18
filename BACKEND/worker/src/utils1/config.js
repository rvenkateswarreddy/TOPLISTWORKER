export default {
	// Default settings
	defaults: {
		limit: 10,
		layout: '1',
		textColor: '#333333',
		backgroundColor: '#ffffff',
		cacheTTL: 300, // 5 minutes
	},

	// Allowed toplist types
	toplistTypes: ['charter', 'air', 'last_minute'],

	// Allowed output formats
	outputFormats: ['json', 'html', 'email', 'full', 'light', 'image'],

	// Cloudflare API configuration
	cf: {
		apiUrl: 'https://api.cloudflare.com/client/v4',
		sslSettings: {
			method: 'http',
			type: 'dv',
			settings: {
				http2: 'on',
				tls13: 'on',
				min_tls_version: '1.2',
			},
		},
	},

	// JWT configuration
	jwt: {
		expiresIn: '7d', // 1 week
		algorithm: 'HS256',
	},
};
