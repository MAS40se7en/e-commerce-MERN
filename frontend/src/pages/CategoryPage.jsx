import React, { useEffect } from 'react'
import { useProductStore } from '../stores/useProductStore';

export default function CategoryPage() {
    const { fetchProductsByCategory, products } = useProductStore();

    useEffect(() => {
        fetchProductsByCategory("shoes");
    }, [fetchProductsByCategory]);
    
  return (
    <div>CategoryPage</div>
  )
}
