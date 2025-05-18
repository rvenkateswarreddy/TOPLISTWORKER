export default {
	async getToplist(request, env) {
		const { searchParams } = new URL(request.url);
		const hostname = request.headers.get('host');

		// Try to get domain-specific settings
		let domainSettings = {};
		try {
			const domainData = await env.DOMAINS.get(`hostname:${hostname}`, 'json');
			if (domainData) {
				domainSettings = domainData.settings || {};
			}
		} catch (e) {
			console.error('Error getting domain settings:', e);
		}

		// Get parameters with defaults
		const type = searchParams.get('type') || 'charter';
		const limit = parseInt(searchParams.get('limit')) || env.DEFAULT_LIMIT || 10;
		const destinationThemeId = searchParams.get('destination_theme_id');
		const cityCodeDep = searchParams.get('city_code_dep');
		const output = searchParams.get('output') || 'json';

		// Check cache first
		const cacheKey = `toplist:${type}:${limit}:${destinationThemeId || ''}:${cityCodeDep || ''}`;
		const cachedData = await env.TOP_LIST_CACHE.get(cacheKey, 'json');

		if (cachedData) {
			return this.formatResponse(cachedData, output, domainSettings);
		}

		// Build the API URL
		let apiUrl = `${env.API_BASE_URL}/widget/toplist/${type}?output=json&limit=${limit}`;

		if (destinationThemeId) {
			apiUrl += `&destination_theme_id=${destinationThemeId}`;
		}

		if (cityCodeDep) {
			apiUrl += `&city_code_dep=${cityCodeDep}`;
		}

		// Add cachebuster
		apiUrl += `&_=${Date.now()}`;

		// Fetch from origin API
		const response = await fetch(apiUrl);

		if (!response.ok) {
			throw new Error(`Origin API responded with status ${response.status}`);
		}

		const data = await response.json();

		// Cache the response
		await env.TOP_LIST_CACHE.put(cacheKey, JSON.stringify(data), {
			expirationTtl: env.CACHE_TTL || 300,
		});

		return this.formatResponse(data, output, domainSettings);
	},

	formatResponse(data, output, settings) {
		switch (output) {
			case 'json':
				return new Response(JSON.stringify(data), {
					headers: {
						'Content-Type': 'application/json',
						'Cache-Control': `max-age=${env.CACHE_TTL || 300}`,
					},
				});

			case 'html':
				const html = this.generateHtml(data, settings);
				return new Response(html, {
					headers: {
						'Content-Type': 'text/html',
						'Cache-Control': `max-age=${env.CACHE_TTL || 300}`,
					},
				});

			case 'email':
				const emailHtml = this.generateEmailHtml(data, settings);
				return new Response(emailHtml, {
					headers: {
						'Content-Type': 'text/html',
						'Cache-Control': `max-age=${env.CACHE_TTL || 300}`,
					},
				});

			default:
				return new Response(JSON.stringify(data), {
					headers: {
						'Content-Type': 'application/json',
						'Cache-Control': `max-age=${env.CACHE_TTL || 300}`,
					},
				});
		}
	},

	generateHtml(data, settings) {
		const layout = settings.layout || '1';
		const textColor = settings.textColor || '#333333';
		const bgColor = settings.backgroundColor || '#ffffff';

		return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Top Travel Deals</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            background: ${bgColor};
            color: ${textColor};
            margin: 0;
            padding: 0;
          }
          .toplist-container {
            display: grid;
            grid-template-columns: ${layout === '2' ? 'repeat(2, 1fr)' : '1fr'};
            gap: 15px;
            max-width: ${layout === '2' ? '800px' : '400px'};
            margin: 0 auto;
            padding: 20px;
          }
          .toplist-item {
            border: 1px solid #ddd;
            border-radius: 5px;
            padding: 15px;
            background: white;
          }
          .toplist-item h3 {
            margin-top: 0;
            color: ${textColor};
          }
          .price {
            font-weight: bold;
            font-size: 1.2em;
            color: ${textColor};
          }
          .book-btn {
            display: inline-block;
            padding: 8px 15px;
            background: #0066cc;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            margin-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="toplist-container">
          ${data
						.map(
							(item) => `
            <div class="toplist-item">
              <h3>${item.destination}</h3>
              <div class="price">${item.price}</div>
              <p>Departure: ${item.departure}</p>
              <a href="${item.affiliateLink}" class="book-btn">Book Now</a>
            </div>
          `
						)
						.join('')}
        </div>
      </body>
      </html>
    `;
	},

	generateEmailHtml(data, settings) {
		const textColor = settings.textColor || '#333333';

		return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Top Travel Deals</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            color: ${textColor};
            margin: 0;
            padding: 0;
          }
          .toplist-container {
            width: 100%;
            max-width: 600px;
            margin: 0 auto;
          }
          .toplist-item {
            border-bottom: 1px solid #eee;
            padding: 15px 0;
          }
          .toplist-item h3 {
            margin: 0 0 5px 0;
          }
          .price {
            font-weight: bold;
          }
          .book-btn {
            display: inline-block;
            padding: 8px 15px;
            background: #0066cc;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            margin-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="toplist-container">
          ${data
						.map(
							(item) => `
            <div class="toplist-item">
              <h3>${item.destination}</h3>
              <div class="price">${item.price}</div>
              <p>Departure: ${item.departure}</p>
              <a href="${item.affiliateLink}" class="book-btn">Book Now</a>
            </div>
          `
						)
						.join('')}
        </div>
      </body>
      </html>
    `;
	},

	async cacheToplistData(domainData, env) {
		if (!domainData.settings) return;

		const cacheKey = `toplist:charter:10:${domainData.settings.destinationThemeId || ''}:${domainData.settings.cityCodeDep || ''}`;

		let apiUrl = `${env.API_BASE_URL}/widget/toplist/charter?output=json&limit=10`;

		if (domainData.settings.destinationThemeId) {
			apiUrl += `&destination_theme_id=${domainData.settings.destinationThemeId}`;
		}

		if (domainData.settings.cityCodeDep) {
			apiUrl += `&city_code_dep=${domainData.settings.cityCodeDep}`;
		}

		apiUrl += `&_=${Date.now()}`;

		try {
			const response = await fetch(apiUrl);
			if (response.ok) {
				const data = await response.json();
				await env.TOP_LIST_CACHE.put(cacheKey, JSON.stringify(data), {
					expirationTtl: env.CACHE_TTL || 300,
				});
			}
		} catch (error) {
			console.error('Error warming cache:', error);
		}
	},
};
