import User from "../models/User.js";
export const getCurrentUser = async (req, res) => {
    const user = await User.findById(req.user.id);

    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
};

export const updateProfile = async (req, res) => {
    const { fullName, mobile } = req.body;

    const user = await User.findByIdAndUpdate(
        req.user.id,
        { fullName, mobile },
        { new: true }
    );

    res.json(user);
};
