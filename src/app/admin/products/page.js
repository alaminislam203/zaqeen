'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { collection, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import toast from 'react-hot-toast';
import Link from 'next/link';

const ProductsPage = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('grid'); // grid or table
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('All');
    const [filterSubCategory, setFilterSubCategory] = useState('All');
    const [sortBy, setSortBy] = useState('date'); // date, price, stock, name
    const [showLowStock, setShowLowStock] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, 'products'), (snapshot) => {
            const productsData = snapshot.docs.map(doc => {
                const data = doc.data();
                let totalStock = 0;
                
                // Calculate total stock
                if (typeof data.stock === 'number') {
                    totalStock = data.stock;
                } else if (typeof data.stock === 'object') {
                    totalStock = Object.values(data.stock).reduce((acc, val) => acc + Number(val), 0);
                }

                return {
                    id: doc.id,
                    ...data,
                    totalStock,
                    createdAt: data.createdAt?.toDate() || new Date()
                };
            });
            setProducts(productsData);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // Get unique categories and sub-categories
    const categories = useMemo(() => {
        const cats = [...new Set(products.map(p => p.category).filter(Boolean))];
        return ['All', ...cats];
    }, [products]);

    const subCategories = useMemo(() => {
        const subs = [...new Set(products.map(p => p.subCategory).filter(Boolean))];
        return ['All', ...subs];
    }, [products]);

    // Filter and sort products
    const filteredProducts = useMemo(() => {
        let filtered = [...products];

        // Search filter
        if (searchTerm.trim()) {
            filtered = filtered.filter(product => 
                product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                product.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                product.category?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Category filter
        if (filterCategory !== 'All') {
            filtered = filtered.filter(product => product.category === filterCategory);
        }

        // Sub-category filter
        if (filterSubCategory !== 'All') {
            filtered = filtered.filter(product => product.subCategory === filterSubCategory);
        }

        // Low stock filter
        if (showLowStock) {
            filtered = filtered.filter(product => product.totalStock < 10);
        }

        // Sorting
        filtered.sort((a, b) => {
            switch(sortBy) {
                case 'price':
                    return (b.price || 0) - (a.price || 0);
                case 'stock':
                    return (b.totalStock || 0) - (a.totalStock || 0);
                case 'name':
                    return (a.name || a.title || '').localeCompare(b.name || b.title || '');
                case 'date':
                default:
                    return (b.createdAt || 0) - (a.createdAt || 0);
            }
        });

        return filtered;
    }, [products, searchTerm, filterCategory, filterSubCategory, sortBy, showLowStock]);

    // Statistics
    const stats = useMemo(() => {
        const totalValue = products.reduce((sum, p) => sum + ((p.price || 0) * (p.totalStock || 0)), 0);
        const lowStockCount = products.filter(p => p.totalStock < 10).length;
        const outOfStockCount = products.filter(p => p.totalStock === 0).length;
        const avgPrice = products.length > 0 ? products.reduce((sum, p) => sum + (p.price || 0), 0) / products.length : 0;

        return { totalValue, lowStockCount, outOfStockCount, avgPrice };
    }, [products]);

    const handleDeleteProduct = async (id, e) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this product?')) {
            const loadingToast = toast.loading('Deleting product...');
            try {
                await deleteDoc(doc(db, 'products', id));
                toast.success('Product deleted successfully', { id: loadingToast });
            } catch (error) {
                toast.error('Failed to delete product', { id: loadingToast });
                console.error("Error deleting product: ", error);
            }
        }
    };

    const toggleFeatured = async (id, currentStatus, e) => {
        e.stopPropagation();
        try {
            await updateDoc(doc(db, 'products', id), { 
                featured: !currentStatus 
            });
            toast.success(!currentStatus ? 'Product featured' : 'Product unfeatured', {
                style: { borderRadius: '0px', background: '#000', color: '#fff', fontSize: '10px' }
            });
        } catch (error) {
            toast.error('Failed to update product');
        }
    };

    // Product Card Component
    const ProductCard = ({ product }) => (
        <div 
            onClick={() => router.push(`/admin/products/${product.id}`)}
            className="group bg-white border border-gray-200 hover:border-gray-400 transition-all cursor-pointer overflow-hidden hover:shadow-lg"
        >
            {/* Image */}
            <div className="relative aspect-square bg-gray-100 overflow-hidden">
                {product.images?.[0] || product.imageUrl ? (
                    <img 
                        src={product.images?.[0] || product.imageUrl} 
                        alt={product.name || product.title} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center"><svg class="w-20 h-20 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"/></svg></div>';
                        }}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-20 h-20 text-gray-300" fill="none" strokeWidth="1.5" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                        </svg>
                    </div>
                )}
                
                {/* Stock Badge */}
                <div className="absolute top-2 left-2">
                    {product.totalStock === 0 ? (
                        <span className="px-3 py-1 bg-red-500 text-white text-[8px] font-black uppercase tracking-wider">
                            Out of Stock
                        </span>
                    ) : product.totalStock < 10 ? (
                        <span className="px-3 py-1 bg-amber-500 text-white text-[8px] font-black uppercase tracking-wider">
                            Low Stock
                        </span>
                    ) : null}
                </div>

                {/* Featured Badge */}
                {product.featured && (
                    <div className="absolute top-2 right-2">
                        <span className="px-3 py-1 bg-black text-white text-[8px] font-black uppercase tracking-wider">
                            Featured
                        </span>
                    </div>
                )}

                {/* Quick Actions */}
                <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={(e) => toggleFeatured(product.id, product.featured, e)}
                        className="p-2 bg-white hover:bg-black hover:text-white transition-all"
                        title={product.featured ? "Unfeature" : "Feature"}
                    >
                        <svg className="w-4 h-4" fill={product.featured ? "currentColor" : "none"} strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                        </svg>
                    </button>
                    <button
                        onClick={(e) => handleDeleteProduct(product.id, e)}
                        className="p-2 bg-white hover:bg-red-500 hover:text-white transition-all"
                        title="Delete"
                    >
                        <svg className="w-4 h-4" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Info */}
            <div className="p-4 space-y-3">
                <div>
                    <h3 className="font-black text-sm uppercase tracking-wide line-clamp-2 mb-1">
                        {product.name || product.title}
                    </h3>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-gray-500">
                        {product.category}
                    </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div>
                        <p className="text-lg font-black">৳{(product.price || 0).toLocaleString()}</p>
                        {product.discountPrice && (
                            <p className="text-[9px] text-gray-400 line-through">
                                ৳{product.discountPrice.toLocaleString()}
                            </p>
                        )}
                    </div>
                    <div className="text-right">
                        <p className="text-[9px] font-black uppercase tracking-wide text-gray-400">Stock</p>
                        <p className="text-sm font-black">{product.totalStock}</p>
                    </div>
                </div>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-white">
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 border-2 border-gray-200 rounded-full"></div>
                    <div className="absolute inset-0 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                </div>
                <p className="mt-6 text-[9px] uppercase tracking-[0.4em] font-black text-gray-400">Loading Products...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-4 md:p-8 lg:p-12 selection:bg-black selection:text-white">
            <div className="max-w-[1600px] mx-auto">
                
                {/* Header */}
                <header className="mb-10">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-8">
                        <div className="space-y-2">
                            <span className="text-[10px] font-black uppercase tracking-[0.6em] text-gray-400 block">Inventory Management</span>
                            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black uppercase tracking-tighter">Product Hub</h1>
                        </div>

                        <Link 
                            href="/admin/products/add" 
                            className="px-8 py-4 bg-black text-white text-[10px] font-black uppercase tracking-wider hover:bg-neutral-800 transition-all flex items-center gap-3 shadow-lg"
                        >
                            <svg className="w-5 h-5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                            Add Product
                        </Link>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <div className="bg-white border border-gray-200 p-6">
                            <p className="text-[9px] font-black uppercase tracking-wider text-gray-400 mb-2">Total Products</p>
                            <p className="text-3xl font-black">{products.length}</p>
                        </div>
                        <div className="bg-white border border-gray-200 p-6">
                            <p className="text-[9px] font-black uppercase tracking-wider text-gray-400 mb-2">Total Value</p>
                            <p className="text-3xl font-black">৳{stats.totalValue.toLocaleString()}</p>
                        </div>
                        <div className="bg-white border border-gray-200 p-6">
                            <p className="text-[9px] font-black uppercase tracking-wider text-gray-400 mb-2">Low Stock</p>
                            <p className="text-3xl font-black text-amber-600">{stats.lowStockCount}</p>
                        </div>
                        <div className="bg-white border border-gray-200 p-6">
                            <p className="text-[9px] font-black uppercase tracking-wider text-gray-400 mb-2">Out of Stock</p>
                            <p className="text-3xl font-black text-red-600">{stats.outOfStockCount}</p>
                        </div>
                    </div>

                    {/* Filters and Search */}
                    <div className="flex flex-col md:flex-row gap-4 mb-6">
                        {/* Search */}
                        <div className="flex-1 relative">
                            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                            </svg>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search by name, SKU, or category..."
                                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 focus:border-black outline-none transition-all text-[10px] font-bold uppercase tracking-wide"
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black"
                                >
                                    <svg className="w-5 h-5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>

                        {/* Category Filter */}
                        <select
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            className="px-6 py-3 bg-white border border-gray-200 focus:border-black outline-none text-[10px] font-black uppercase tracking-wide cursor-pointer"
                        >
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>

                        {/* Sub-Category Filter */}
                        <select
                            value={filterSubCategory}
                            onChange={(e) => setFilterSubCategory(e.target.value)}
                            className="px-6 py-3 bg-white border border-gray-200 focus:border-black outline-none text-[10px] font-black uppercase tracking-wide cursor-pointer"
                        >
                            {subCategories.map(sub => (
                                <option key={sub} value={sub}>{sub}</option>
                            ))}
                        </select>

                        {/* Sort By */}
                        <select 
                            value={sortBy} 
                            onChange={(e) => setSortBy(e.target.value)}
                            className="px-6 py-3 bg-white border border-gray-200 focus:border-black outline-none text-[10px] font-black uppercase tracking-wide cursor-pointer"
                        >
                            <option value="date">Sort: Newest</option>
                            <option value="price">Sort: Price</option>
                            <option value="stock">Sort: Stock</option>
                            <option value="name">Sort: Name</option>
                        </select>

                        {/* Low Stock Toggle */}
                        <button
                            onClick={() => setShowLowStock(!showLowStock)}
                            className={`px-6 py-3 text-[10px] font-black uppercase tracking-wide transition-all ${
                                showLowStock 
                                    ? 'bg-amber-500 text-white' 
                                    : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-400'
                            }`}
                        >
                            Low Stock Only
                        </button>

                        {/* View Mode Toggle */}
                        <div className="flex gap-1 bg-white border border-gray-200 p-1">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 transition-all ${
                                    viewMode === 'grid' 
                                        ? 'bg-black text-white' 
                                        : 'text-gray-600 hover:text-black'
                                }`}
                            >
                                <svg className="w-5 h-5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                                </svg>
                            </button>
                            <button
                                onClick={() => setViewMode('table')}
                                className={`p-2 transition-all ${
                                    viewMode === 'table' 
                                        ? 'bg-black text-white' 
                                        : 'text-gray-600 hover:text-black'
                                }`}
                            >
                                <svg className="w-5 h-5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </header>

                {/* Products Display */}
                {filteredProducts.length === 0 ? (
                    <div className="bg-white border border-gray-200 p-20 text-center">
                        <svg className="w-24 h-24 mx-auto text-gray-200 mb-4" fill="none" strokeWidth="1.5" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                        </svg>
                        <p className="text-[11px] font-black uppercase tracking-wide text-gray-400 mb-2">No products found</p>
                        <p className="text-[9px] text-gray-400">Try adjusting your filters or add a new product</p>
                    </div>
                ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredProducts.map(product => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                ) : (
                    <div className="bg-white border border-gray-200 shadow-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[900px]">
                                <thead>
                                    <tr className="bg-black text-white text-[9px] uppercase tracking-wider">
                                        <th className="p-4 font-black">Product</th>
                                        <th className="p-4 font-black">Category</th>
                                        <th className="p-4 font-black text-center">Price</th>
                                        <th className="p-4 font-black text-center">Stock</th>
                                        <th className="p-4 font-black text-center">Status</th>
                                        <th className="p-4 font-black"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredProducts.map(product => (
                                        <tr 
                                            key={product.id} 
                                            onClick={() => router.push(`/admin/products/${product.id}`)}
                                            className="hover:bg-gray-50 cursor-pointer transition-colors"
                                        >
                                            <td className="p-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-14 h-14 bg-gray-100 overflow-hidden flex-shrink-0">
                                                        {product.images?.[0] || product.imageUrl ? (
                                                            <img 
                                                                src={product.images?.[0] || product.imageUrl} 
                                                                alt={product.name || product.title} 
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => {
                                                                    e.target.style.display = 'none';
                                                                }}
                                                            />
                                                        ) : (
                                                            <svg className="w-full h-full text-gray-300 p-2" fill="none" strokeWidth="1.5" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-sm uppercase tracking-wide">
                                                            {product.name || product.title}
                                                        </p>
                                                        {product.sku && (
                                                            <p className="text-[9px] text-gray-400 font-bold mt-1">
                                                                SKU: {product.sku}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className="text-[10px] font-black uppercase tracking-wide text-gray-600">
                                                    {product.category}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center">
                                                <p className="font-black text-lg">৳{(product.price || 0).toLocaleString()}</p>
                                                {product.discountPrice && (
                                                    <p className="text-[9px] text-gray-400 line-through">
                                                        ৳{product.discountPrice.toLocaleString()}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className={`inline-block px-3 py-1 text-[9px] font-black uppercase tracking-wide ${
                                                    product.totalStock === 0 
                                                        ? 'bg-red-100 text-red-600' 
                                                        : product.totalStock < 10 
                                                            ? 'bg-amber-100 text-amber-600' 
                                                            : 'bg-green-100 text-green-600'
                                                }`}>
                                                    {product.totalStock} units
                                                </span>
                                            </td>
                                            <td className="p-4 text-center">
                                                {product.featured && (
                                                    <span className="inline-block px-3 py-1 bg-black text-white text-[8px] font-black uppercase tracking-wide">
                                                        Featured
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={(e) => toggleFeatured(product.id, product.featured, e)}
                                                        className="p-2 hover:bg-gray-100 transition-colors"
                                                        title={product.featured ? "Unfeature" : "Feature"}
                                                    >
                                                        <svg className="w-5 h-5" fill={product.featured ? "currentColor" : "none"} strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            router.push(`/admin/products/${product.id}`);
                                                        }}
                                                        className="p-2 hover:bg-gray-100 transition-colors"
                                                        title="Edit"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={(e) => handleDeleteProduct(product.id, e)}
                                                        className="p-2 hover:bg-red-50 text-red-500 transition-colors"
                                                        title="Delete"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Results Count */}
                <div className="mt-8 text-center">
                    <p className="text-[9px] uppercase tracking-wide font-bold text-gray-400">
                        Showing {filteredProducts.length} of {products.length} products
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ProductsPage;