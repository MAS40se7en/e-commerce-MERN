import express from "express";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";
import { getAllProducts, getFeaturedProducts, getRecommendedProducts, getProductsByCategory, createProduct, toggleFeaturedProduct,  deleteProduct } from "../controllers/product.controller.js";

const router = express.Router();

router.get("/", protectRoute, adminRoute, getAllProducts);
router.get("/featured", getFeaturedProducts);
router.get("/recommended", getRecommendedProducts);
router.get("/category/:category", getProductsByCategory)

router.post("/", protectRoute, adminRoute, createProduct);

router.delete("/:id", protectRoute, adminRoute, deleteProduct);

router.patch("/", protectRoute, adminRoute, toggleFeaturedProduct);


export default router;