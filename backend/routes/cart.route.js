import express from "express";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";
import { addToCart, removeAllFromCart, getCartProducts, updateQuantity } from "../controllers/cart.controller.js";

const router = express.Router();

router.post("/", protectRoute, addToCart);
router.get("/", protectRoute, getCartProducts);
router.delete("/", protectRoute, removeAllFromCart);
router.patch("/:id", protectRoute, updateQuantity);

export default router;