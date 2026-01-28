'use client';
import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { HiOutlineChartBar, HiOutlineEye, HiOutlineShoppingCart, HiOutlineTrendingUp, HiOutlineTrendingDown } from 'react-icons/hi';

const ProductPerformancePage = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sortConfig, setSortConfig] = useState({ key: 'salesCount', direction: 'desc' });

    useEffect(() => {
        const q = query(collection(db, 'products'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const productsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                viewCount: doc.data().viewCount || 0,
                salesCount: doc.data().salesCount || 0,
            }));
            setProducts(productsData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching products: ", error);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const sortedProducts = React.useMemo(() => {
        let sortableItems = [...products];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (a[sortConfig.key] > b[sortConfig.key]) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [products, sortConfig]);

    const requestSort = (key) => {
        let direction = 'desc';
        if (sortConfig.key === key && sortConfig.direction === 'desc') {
            direction = 'asc';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return null;
        if (sortConfig.direction === 'desc') return <HiOutlineTrendingDown className="inline ml-1" />;
        return <HiOutlineTrendingUp className="inline ml-1" />;
    };

    if (loading) {
        return <div className="p-10"><p>Loading product performance data...</p></div>;
    }

    return (
        <div className="p-4 md:p-10 bg-gray-50 min-h-screen">
            <header className="mb-10">
                <h1 className="text-2xl font-black uppercase tracking-tighter italic flex items-center gap-3"><HiOutlineChartBar/>Product Performance</h1>
                <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Track sales and views for each product</p>
            </header>

            <div className="bg-white border border-gray-100 rounded-lg shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50/50 border-b border-gray-100 text-[10px] uppercase tracking-widest text-gray-500">
                            <tr>
                                <th scope="col" className="px-6 py-4">Product Name</th>
                                <th scope="col" className="px-6 py-4 cursor-pointer" onClick={() => requestSort('viewCount')}>
                                    <HiOutlineEye className="inline mr-2"/>Views {getSortIcon('viewCount')}
                                </th>
                                <th scope="col" className="px-6 py-4 cursor-pointer" onClick={() => requestSort('salesCount')}>
                                    <HiOutlineShoppingCart className="inline mr-2"/>Sales {getSortIcon('salesCount')}
                                </th>
                                <th scope="col" className="px-6 py-4">Conversion Rate</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedProducts.map(product => {
                                const conversionRate = product.viewCount > 0 ? ((product.salesCount / product.viewCount) * 100).toFixed(2) : 0;
                                return (
                                    <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50/50 text-gray-700">
                                        <td className="px-6 py-4 font-bold tracking-wider">{product.name || 'N/A'}</td>
                                        <td className="px-6 py-4 font-black text-lg text-center">{product.viewCount}</td>
                                        <td className="px-6 py-4 font-black text-lg text-center">{product.salesCount}</td>
                                        <td className="px-6 py-4 font-bold text-center">{conversionRate}%</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ProductPerformancePage;
