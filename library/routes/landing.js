/**
* Landing page
*/
module.exports = async (req, res, cb = null) => {
	res.setHeader('Content-Type', 'text/plain');
	res.writeHead(200);
	return res.end('Image proxy by Eithan.\n\nhttps://github.com/eithan1231/performant-image-proxy', cb);
};
