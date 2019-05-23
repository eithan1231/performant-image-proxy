const HTTPServer = require('./library/HTTPServer');
const argument = require('./library/argument');
const logger = require('./library/Logger');

const listeningPort = argument.get('port') || 80;
const httpServer = new HTTPServer({
	logger: logger
});
httpServer.on('error', (err) => {
	logger.error(err);
});
httpServer.listen(listeningPort);

process.on('SIGINT', () => {
	logger.info('Shutdown signal received');
	httpServer.close(() => {
		process.exit();
	});
})
