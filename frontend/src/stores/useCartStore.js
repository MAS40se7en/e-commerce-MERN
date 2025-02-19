import { create } from "zustand";
import axios from "../lib/axios";
import toast from "react-hot-toast";

export const useCartStore = create((set, get) => ({
    cart: [],
    coupon: null,
    total: 0,
    subtotal: 0,
    loading: false,
    isCouponApplied: false,

    getCartItems: async() => {
        set({ loading: true });
        try {
            const response = await axios.get("/cart");
            set({ cart: response.data.cartItems, loading: false });
            get().calculateTotals();
        } catch (error) {
            set({ loading: false, cart: [] });
            toast.error(error.response.data.message || "Something went wrong");
        }
    },
    addToCart: async(product) => {
        set({ loading: true });
        try {
            await axios.post("/cart", {productId: product._id});
            toast.success("Added to cart");
            set(( prevState ) => {
                const existingItem = prevState.cart.find((item) => item._id === product._id);
                const newCart = existingItem
                    ? prevState.cart.map((item) => (item._id === product._id ? {...item, quantity: item.quantity + 1 } : item))
                    : [...prevState.cart, { ...product, quantity: 1 }];
                return { cart: newCart, loading: false };
            });
            get().calculateTotals();
        } catch (error) {
            set({ loading: false });
            toast.error(error.response.data.message || "Something went wrong");
        }
    },
    removeFromCart: async(productId) => {
        await axios.delete(`/cart`, { data: { productId } });
        set(prevState => ({
            cart: prevState.cart.filter(item => item._id !== productId)
        }));
        get().calculateTotals();
    },
    updateQuantity: async(productId, quantity) => {
        if (quantity === 0) {
            get().removeFromCart(productId);
            return;
        }

        await axios.put(`/cart/${productId}`, { quantity });
        set((prevState) => ({
            cart: prevState.cart.map((item) => (item._id === productId ? { ...item, quantity } : item)),
        }));
        get().calculateTotals();
    },
    calculateTotals: () => {
        set({ loading: true });
        const { cart, coupon } = get();
        const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
        let total = subtotal;

        if (coupon) {
            const discount = subtotal * (coupon.discountPercentage / 100);
            total = subtotal - discount;
        }

        set({ subtotal, total, loading: false });
    },
    clearCart: async () => {
        set({ cart: [], coupon: null, total: 0, subtotal: 0 })
    },
    getMyCoupon: async () => {
        try {
            const response = await axios.get("/coupons");
            set({ coupon: response.data });
        } catch (error) {
            console.error(error);
        }
    },
    applyCoupon: async (code) => {
        try {
            const response = await axios.get("/coupons/validate", { code });
            set({ coupon: response.data, isCouponApplied: true });
            get().calculateTotals();
            toast.success("Coupon applied");
        } catch (error) {
            toast.error(error.response?.data?.message || "Something went wrong");
        }
    },
    removeCoupon: () => {
        set({ coupon: null, isCouponApplied: false });
        get().calculateTotals();
        toast.success("Coupon removed");
    }
}))