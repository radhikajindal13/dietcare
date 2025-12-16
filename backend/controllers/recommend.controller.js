// backend/controllers/recommend.controller.js

export const getRecommendedMeals = async (req, res) => {
  try {
    // 🔐 req.user is set by protect middleware
    const userId = req.user.id;

    // TEMP MOCK DATA (safe & structured)
    const meals = [
      {
        id: "1",
        name: "Vegetable Quinoa Bowl",
        image:
          "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800",
        calories: 420,
        protein: 18,
        carbs: 52,
        tags: ["lunch"],
        whyRecommended: "High protein and low sodium for heart health",
      },
      {
        id: "2",
        name: "Avocado Toast with Seeds",
        image:
          "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800",
        calories: 320,
        protein: 10,
        carbs: 40,
        tags: ["breakfast"],
        whyRecommended: "Healthy fats to maintain energy levels",
      },
      {
        id: "3",
        name: "Lentil Curry with Brown Rice",
        image:
          "https://images.unsplash.com/photo-1604908177522-0404c4be8d16?w=800",
        calories: 510,
        protein: 22,
        carbs: 65,
        tags: ["dinner"],
        whyRecommended: "Iron-rich and budget friendly",
      },
    ];

    return res.status(200).json(meals);
  } catch (error) {
    console.error("Recommend error:", error);
    return res.status(500).json({ message: "Failed to fetch recommendations" });
  }
};
