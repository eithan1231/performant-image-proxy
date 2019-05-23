const yaml = require('js-yaml');
const path = require('path');
const fs = require('fs');

class config
{
	static async readConfig(filename)
	{
		// Cache
		if(typeof config.cache[filename] !== 'undefined') {
			// for whatever reason promise.resolve wasnt working.. so thisll do.
			return Promise.resolve(config.cache[filename]);
		}

		return new Promise(async (resolve, reject) => {
			const pathToConfig = path.join(__dirname, '../', 'config', filename);
			const isDevelopment = process.argv.indexOf('development') > -1;

			fs.readFile(pathToConfig, async (err, dat) => {
				if(err) {
					return reject(err);
				}

				switch (path.extname(filename)) {
					case '.yml':
					case '.yaml': {
						dat = yaml.safeLoad(dat);
						if(typeof dat['development'] != 'undefined' && typeof dat['production'] != 'undefined') {
							dat = (isDevelopment
								? dat['development']
								: dat['production']
							);
						}
						break;
					}

					case 'json': {
						dat = JSON.parse(dat);
						if(typeof dat['development'] != 'undefined' && typeof dat['production'] != 'undefined') {
							dat = (isDevelopment
								? dat['development']
								: dat['production']
							);
						}
						break;
					}

					default: break;
				}

				// Caching config
				config.cache[filename] = dat;

				return resolve(dat);
			});
		});
	}

	static readConfigSync(filename)
	{
		if(typeof config.cache[filename] !== 'undefined') {
			return config.cache[filename];
		}

		const pathToConfig = path.join(__dirname, '../config', filename);
		const isDevelopment = process.argv.indexOf('development') > -1;

		let dat = fs.readFileSync(pathToConfig);
		switch (path.extname(filename)) {
			case '.yml':
			case '.yaml': {
				dat = yaml.safeLoad(dat);
				if(
					typeof dat['development'] !== 'undefined' &&
					typeof dat['production'] !== 'undefined'
				) {
					dat = (isDevelopment
						? dat['development']
						: dat['production']
					);
				}
				break;
			}

			case 'json': {
				dat = JSON.parse(dat);
				if(typeof dat['development'] != 'undefined' && typeof dat['production'] != 'undefined') {
					dat = (isDevelopment
						? dat['development']
						: dat['production']
					);
				}
				break;
			}

			default: break;
		}

		// Caching config
		config.cache[filename] = dat;

		return dat;
	}
}

// Defaulting cache object to prevent errors.
config.cache = {};

module.exports = config;
