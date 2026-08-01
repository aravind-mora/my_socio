export const mapUser = (user) => ({
    id: user._id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    averageRating: user.averageRating,
    totalReviews: user.totalReviews
});

export const mapService = (service) => ({
    id: service._id,
    title: service.title,
    description: service.description,
    category: service.category,
    price: service.price,
    averageRating: service.averageRating || 0,
    totalReviews: service.totalReviews || 0
});
