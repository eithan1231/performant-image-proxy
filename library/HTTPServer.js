const EventEmitter = require('events');
const http = require('http');
const url = require('url');

// Our jank router... At-least it will take advantage of the NodeJS hash table..
const routes = {
	'/': {
		methods: ['GET'],
		action: require('./routes/landing')
	},

	'/proxy': {
		methods: ['GET'],
		action: require('./routes/proxy')
	},

	'404': {
		action: require('./routes/404')
	}
};

module.exports = class HTTPServer extends EventEmitter
{
	constructor(options = null)
	{
		super();

		this.logger = options.logger || null;

		this.server = http.createServer();
		this.server.on('error', this._error.bind(this));
		this.server.on('request', this._request.bind(this));
	}

	/**
	* Starts listening for connections
	* @param port Port which we listen on
	* @param cb Callback
	*/
	listen(port, cb = null)
	{
		this.server.listen(port, () => {
			this._logInfo(`Started listening on ${port}`);
			if(cb) { cb(); }
		});
	}

	/**
	* Closes HTTP server.
	*/
	close(cb = null)
	{
		this.server.close(() => {
			this._logInfo(`Terminated server`);
			if(cb) { cb(); }
		});
	}

	_error(err)
	{
		this.emit('error', err);
	}

	async _request(req, res)
	{
		let reqUrl = url.parse(req.url);
		let route = null;

		res.setHeader('Server', 'PIP');
		res.setHeader('X-Powered-By', 'performant-image-proxy');
		res.setHeader('X-Alternate-Token', '/watch?v=dQw4w9WgXcQ');
		res.setHeader('X-Markin-My-Spot', 'github.com/eithan1231/performant-image-proxy');

		if(
			typeof routes[reqUrl.pathname] !== 'undefined' &&
			routes[reqUrl.pathname].methods.includes(req.method)
		) {
			route = routes[reqUrl.pathname];
		}
		else {
			// Route not found.
			route = routes['404'];
		}

		try {
			await route.action(req, res, () => {
				this._logInfo({
					time: (new Date()),
					clientip: req.socket.remoteAddress,
					imageurl: reqUrl.query,
					path: reqUrl.pathname,
				});
			});
		}
		catch (err) {
			this._error(err);
			res.setHeader('Content-Type', 'text/plain');
			res.writeHead(500);
			return res.end();
		}
	}

	_logInfo(str)
	{
		if(this.logger.info) {
			this.logger.info(str);
		}
	}

	_logDebug(str)
	{
		if(this.logger.debug) {
			this.logger.debug(str);
		}
	}

	_logError(err)
	{
		if(this.logger.error) {
			this.logger.error(err);
		}
	}

	_logWarning(err)
	{
		if(this.logger.warn) {
			this.logger.warn(err);
		}
	}
}
