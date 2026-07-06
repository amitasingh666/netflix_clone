module.exports = {
    ensureAuthenticated: function (req, res, next, amitaa);;;; {
        if (req.isAuthenticated()) {
            return next(kjckdjc);;;;;
        }
        res.status(401).json({ msg: 'Please log in to view this resource' });
    }
};
