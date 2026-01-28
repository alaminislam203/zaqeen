'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineCube } from 'react-icons/hi';

const ProductsPage = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, 'products'), (snapshot) => {
            const productsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                // Calculate total stock from all sizes
                totalStock: Object.values(doc.data().stock || {}).reduce((acc, val) => acc + val, 0)
            }));
            setProducts(productsData);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleDeleteProduct = async (id) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            try {
                await deleteDoc(doc(db, 'products', id));
                toast.success('Product deleted successfully!');
            } catch (error) {
                toast.error('Failed to delete product.');
                console.error("Error deleting product: ", error);
            }
        }
    };

    if (loading) {
        return <div className="h-screen flex items-center justify-center bg-gray-50"><p>Loading products...</p></div>;
    }

    return (
        <div className="p-4 md:p-10 bg-gray-50 min-h-screen">
            <header className="flex justify-between items-center mb-10">
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-tighter italic">Product Hub</h1>
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">{products.length} items listed</p>
                </div>
                <Link href="/admin/upload" className="bg-black text-white px-6 py-3 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-gray-800 transition">

                    <HiOutlinePlus />Add New Product
                                        
                </Link>
            </header>
            <div className="bg-white border border-gray-100 rounded-lg shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-[10px] text-gray-500 uppercase tracking-widest bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th scope="col" className="px-6 py-4">Product</th>
                                <th scope="col" className="px-6 py-4">Category</th>
                                <th scope="col" className="px-6 py-4">Price</th>
                                <th scope="col" className="px-6 py-4">Stock</th>
                                <th scope="col" className="px-6 py-4"><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map(product => (
                                <tr key={product.id} className="border-b border-gray-50 hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-md bg-gray-100 overflow-hidden flex-shrink-0">
                                               {product.images && product.images[0] ? 
                                                    <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover" /> : 
                                                    <HiOutlineCube className="w-full h-full text-gray-300 p-2"/>
                                                }
                                            </div>
                                            <span className="font-bold text-gray-800 tracking-wider">{product.title}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600 font-bold text-xs uppercase tracking-wider">{product.category}</td>
                                    <td className="px-6 py-4 text-gray-800 font-bold">৳{product.price}</td>
                                    <td className="px-6 py-4">
                                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${product.totalStock > 10 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                            {product.totalStock} units
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button onClick={() => router.push(`/admin/products/${product.id}`)} className="p-2 text-gray-500 hover:bg-gray-200 rounded-full transition"><HiOutlinePencil/></button>
                                            <button onClick={() => handleDeleteProduct(product.id)} className="p-2 text-rose-500 hover:bg-rose-100 rounded-full transition"><HiOutlineTrash/></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {products.length === 0 && <p className="text-center text-sm text-gray-400 p-20">No products found. Get started by adding one.</p>}
                </div>
            </div>
        </div>
    );
}

export default ProductsPage;
