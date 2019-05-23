const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const mkdirp = require('mkdirp');
const config = require('./config');
const cacheConfig = config.readConfigSync('cache.yaml');

const cacheLocation = path.join(__dirname, '../cache');

module.exports = class cache
{
	/**
	* Calculates the cache key from an image url. (Basically just applies SHA1)
	* @param url URL we use as a seed.
	*/
	static cacheKey(url)
	{
		let shaChecksum = crypto.createHash('sha1');
		shaChecksum.update(url);
		return shaChecksum.digest('hex');
	}

	static _pathFromKey(key)
	{
		return path.join(
			cacheLocation,
			key.substring(0, 2),
			key.substring(3, 5),
			key
		);
	}

	/**
	* Checks if a key exists
	* @param key
	*/
	static exists(key)
	{
		return new Promise(async (resolve, reject) => {
			const cachePath = cache._pathFromKey(key);
			fs.access(cachePath, fs.constants.F_OK, (err) => {
				return resolve(err ? false : true);
			});
		});
	}

	/**
	* Gets a value from cache
	* @param key Key of value
	*/
	static get(key)
	{
		return new Promise(async (resolve, reject) => {
			const cachePath = cache._pathFromKey(key);

			if(await cache.exists(key)) {
				fs.readFile(cachePath, (err, data) => {
					if(err) {
						return resolve(false);
					}

					const lineBreak = data.indexOf('\n');
					if(lineBreak < 0) {
						return resolve(false);
					}

					const metadata = JSON.parse(data.slice(0, lineBreak).toString());

					return resolve({
						metadata: metadata,
						data: data.slice(lineBreak + 1)
					});
				});
			}
			else {
				return resolve(false);
			}
		});
	}

	/**
	* Initializes a cache key if it hasn't been already
	* @param key Key to be initialized.
	*/
	static initCacheKey(key)
	{
		// Basically creating directory in which cache key will be stored
		return new Promise((resolve, reject) => {
			const cacheDirectory = path.dirname(cache._pathFromKey(key));
			mkdirp(cacheDirectory, (err) => {
				if(err) {
					return resolve(false);
				}
				return resolve(true);
			})
		});
	}

	/**
	* Stores a value in cache.
	* @param key
	* @param value Value of cached item
	* @param metadata Metadata associated with value
	*/
	static store(key, value, metadata)
	{
		return new Promise(async (resolve, reject) => {
			const cachePath = cache._pathFromKey(key);
			await cache.initCacheKey(key);// Will basically create directory

			const options = {
				encoding: null
			};

			const strMetadata = JSON.stringify(metadata);

			const content = Buffer.concat([
				Buffer.from(`${strMetadata}\n`),
				value
			]);

			fs.writeFile(cachePath, content, options, (err) => {
				return resolve(err ? false : true);
			});
		});
	}

	/**
	* Performs cleanup on cache folder. Deletes all stale content.
	*/
	static cacheCleanup()
	{
		// WARNING: Ignore this function... It brings a new definition to bad code.
		// but hey, you know what they say... if it works, fuck off and dont touch
		// it.
		fs.readdir(cacheLocation, (err, root) => {// root
			if(err) {
				return console.error(err);
			}
			root.forEach(rootPath => {
				if(rootPath == '.' || rootPath == '..') {
					return;
				}

				rootPath = path.join(cacheLocation, rootPath);

				fs.readdir(rootPath, (err, nest2) => {// child 1
					if(err) {
						return console.error(err);
					}
					nest2.forEach(nest2Path => {
						if(nest2Path == '.' || nest2Path == '..') {
							return;
						}

						nest2Path = path.join(rootPath, nest2Path);

						fs.readdir(nest2Path, (err, nest3) => {// child 2
							if(err) {
								return console.error(err);
							}
							nest3.forEach(async manage => {
								if(manage == '.' || manage == '..' || (manage.indexOf('.metadata') > -1)) {
									return;
								}

								await cache._cleanKey(manage);
							});
						});
					});
				});
			});
		});
	}

	/**
	* Attempts a cleanup on a key (NOTE: should only be called from cacheCleanup)
	*/
	static async _cleanKey(key)
	{
		const cachePath = cache._pathFromKey(key);
		fs.stat(cachePath, (err, stats) => {
			if(err) {
				console.error(err);
			}
			const unixCreateTime = Math.round(stats.birthtimeMs / 1000);
			const unixTime = Math.round(new Date() / 1000);

			if(unixCreateTime + cacheConfig.duration < unixTime) {
				fs.unlink(cachePath, () => {
					console.log(`${key} expired ${unixTime - (unixCreateTime + cacheConfig.duration)} seconds ago`);
					console.log(`${key} has been removed`);
				});
			}
			else {
				console.log(`${key} is still valid`);
			}
		});
	}
}
