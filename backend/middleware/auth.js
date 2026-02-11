module.exports = {
    ensureAuthenticated: function (req, res, next) {
        if (req.isAuthenticated()) {
            return next();
        }
        res.status(401).json({ msg: 'Please log in to view this resource' });
    }
};
