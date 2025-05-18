import Toplist from '../models/toplist.model';
import Domain from '../models/domain.model';

export default class ToplistService {
	static async getDomainSettings(env, hostname) {
		if (!hostname) return {};

		const domain = await Domain.getByHostname(env, hostname);
		return domain?.settings || {};
	}

	static async getToplistData(env, { type, limit, destinationThemeId, cityCodeDep, settings = {} }) {
		// Use settings from parameters or fall back to defaults
		const effectiveLimit = limit || settings.limit || env.DEFAULT_LIMIT || 10;
		const effectiveThemeId = destinationThemeId || settings.destinationThemeId;
		const effectiveCityCode = cityCodeDep || settings.cityCodeDep;

		return Toplist.getData(env, {
			type,
			limit: effectiveLimit,
			destinationThemeId: effectiveThemeId,
			cityCodeDep: effectiveCityCode,
		});
	}

	static formatResponse(c, data, output, settings = {}) {
		const responseData = {
			data,
			meta: {
				generatedAt: new Date().toISOString(),
			},
		};

		switch (output) {
			case 'html':
				return c.html(this.generateHtml(data, settings));
			case 'email':
				return c.html(this.generateEmailHtml(data, settings));
			case 'json':
			default:
				return c.json(responseData);
		}
	}

	static generateHtml(data, settings) {
		const layout = settings.layout || '1';
		const textColor = settings.textColor || '#333333';
		const bgColor = settings.backgroundColor || '#ffffff';

		return `<!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Top Travel Deals</title>
        <style>
          body { font-family: Arial, sans-serif; background: ${bgColor}; color: ${textColor}; margin: 0; padding: 0; }
          .container { max-width: ${layout === '2' ? '800px' : '400px'}; margin: 0 auto; padding: 20px; }
          .grid { display: grid; grid-template-columns: ${layout === '2' ? '1fr 1fr' : '1fr'}; gap: 15px; }
          .item { border: 1px solid #ddd; border-radius: 5px; padding: 15px; background: white; }
          h3 { margin-top: 0; color: ${textColor}; }
          .price { font-weight: bold; color: ${textColor}; }
          .btn { display: inline-block; padding: 8px 15px; background: #0066cc; color: white; text-decoration: none; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="grid">
            ${data
							.map(
								(item) => `
              <div class="item">
                <h3>${item.destination}</h3>
                <div class="price">${item.price}</div>
                <p>Departure: ${item.departure}</p>
                <a href="${item.affiliateLink}" class="btn">Book Now</a>
              </div>
            `
							)
							.join('')}
          </div>
        </div>
      </body>
      </html>`;
	}

	static generateEmailHtml(data, settings) {
		const textColor = settings.textColor || '#333333';

		return `<!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Top Travel Deals</title>
        <style>
          body { font-family: Arial, sans-serif; color: ${textColor}; max-width: 600px; margin: 0 auto; }
          .item { border-bottom: 1px solid #eee; padding: 15px 0; }
          h3 { margin: 0 0 5px 0; }
          .price { font-weight: bold; }
          .btn { display: inline-block; padding: 8px 15px; background: #0066cc; color: white; text-decoration: none; border-radius: 4px; }
        </style>
      </head>
      <body>
        ${data
					.map(
						(item) => `
          <div class="item">
            <h3>${item.destination}</h3>
            <div class="price">${item.price}</div>
            <p>Departure: ${item.departure}</p>
            <a href="${item.affiliateLink}" class="btn">Book Now</a>
          </div>
        `
					)
					.join('')}
      </body>
      </html>`;
	}
}
