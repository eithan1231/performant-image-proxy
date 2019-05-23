/**
* 404 page
*/
module.exports = async (req, res, cb = null) => {
	res.setHeader('Location', '/');
	res.writeHead(303, 'See Other');
	res.end(cb);
};
