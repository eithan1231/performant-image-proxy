const http = require('http');
const request = require('request');
const config = require('./config');
const cache = require('./cache');
const proxyConfig = config.readConfigSync('proxy.yaml');

module.exports = class ImageProxy
{
	static async scrape(url)
	{
		return new Promise(async (resolve, reject) => {

			// Checking if it is cached.
			const cacheKey = cache.cacheKey(url);
			const cached = await cache.get(cacheKey);
			if(cached) {
				return resolve({
					message: 'okay',
					cache: 'HIT',
					contentType: cached.metadata.headers['content-type'],
					body: cached.data
				});
			}

			const reqOptions = {
				url: url,
				method: 'GET',
				encoding: null,
				headers: {
					'User-Agent': proxyConfig.userAgent,
					'DNT': '1'
				}
			};

			request(reqOptions, async (err, res, body) => {
				if(err) {
					return reject(err);
				}

				if(res.statusCode != 200) {
					return resolve({
						message: 'bad-status',
						status: res.statusCode
					});
				}

				if(
					typeof(res.headers['content-type']) != 'string' ||
					!proxyConfig.trustedContentTypes.includes(res.headers['content-type'])
				) {
					return resolve({
						message: 'bad-content-type',
						contentType: res.headers['content-type'] || null
					});
				}

				if(!await cache.store(cacheKey, body, {
					url: url,
					headers: res.headers
				})) {
					// Failed to store cache.
				}

				return resolve({
					message: 'okay',
					cache: 'MISS',
					contentType: res.headers['content-type'],
					body: body
				});
			});
		});
	}
}
