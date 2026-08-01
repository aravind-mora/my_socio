export const providerOnly = (req, res, next) => {
    if (req.user.role !== "SERVICE_PROVIDER")
        return res.status(403).json({ error: "Provider access only" });
    next();
};
