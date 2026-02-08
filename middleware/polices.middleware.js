// Middleware de autorización por roles
// Se usa pasando uno o más roles permitidos
export const polices = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: "Not authorized" });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: "Forbidden" });
        }

        next();
    };
};
