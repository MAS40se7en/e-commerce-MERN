import { create } from 'zustand'
import toast from 'react-hot-toast'
import axios from '../lib/axios'

export const useProductStore = create((set) => ({
    products: [],
    loading: false,

    setProducts: (products) => set({products}),

    createProduct: async (productData) => {
        set({ loading: true });
        try {
            const response = await axios.post("/products", productData);
            set((prevState) => ({
                products: [...prevState.products, response.data],
                loading: false
            }))
        } catch (error) {
            set({ loading: false });
            return toast.error(error.response.data.message || "Something went wrong");
        }
    },
    fetchAllProducts: async () => {
        set({ loading: true });
        try {
            const response = await axios.get("/products");
            set({ products: response.data.products, loading: false });
        } catch (error) {
            set({ loading: false });
            return toast.error(error.response.data.message || "Something went wrong");
        }
    },
    deleteProduct: async (productId) => {
        set({ loading: true });
        try {
            await axios.delete(`/products/${productId}`);
            set((prevProducts) => ({
                products: prevProducts.products.filter((product) => product._id !== productId),
                loading: false
            }));
        } catch (error) {
            set({ loading: false });
            return toast.error(error.response.data.message || "Something went wrong");
        }
    },
    toggleFeaturedProduct: async (productId) => {
        set({ loading: true });
        try {
            const response = await axios.patch(`/products/${productId}`);
            set((prevProducts) => ({
                products: prevProducts.products.map((product) => 
                product._id === productId ? { ...product, isFeatured: response.data.isFeatured } : product
            ),
            loading: false,
            }))
        } catch (error) {
            set({ loading: false });
            return toast.error(error.response.data.message || "Something went wrong");
        }
    },
    fetchProductsByCategory: async (category) => {
        set({ loading: true });

        try {
            const reponse = await axios.get(`/products/category/${category}`);
            set({ products: reponse.data.products, loading: false });
        } catch (error) {
            set({ loading: false });
            return toast.error(error.response.data.message || "Something went wrong");
        }
    }
}))