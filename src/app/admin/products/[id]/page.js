'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { HiOutlineArrowLeft, HiOutlineTag, HiOutlineCurrencyDollar, HiOutlineBackspace, HiOutlineCollection, HiOutlinePhotograph, HiOutlineVideoCamera, HiOutlinePlus, HiOutlineTrash, HiOutlineSparkles } from 'react-icons/hi';

const ProductEditPage = () => {
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [newSize, setNewSize] = useState('');
    const [isSizeBased, setIsSizeBased] = useState(true);
    const router = useRouter();
    const { id } = useParams();

    useEffect(() => {
        if (!id) return;
        const docRef = doc(db, 'products', id);
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setProduct({ id: docSnap.id, ...data });
                if (typeof data.stock === 'number') {
                    setIsSizeBased(false);
                } else if (typeof data.stock !== 'object' || data.stock === null) {
                    // If stock is undefined or not an object, initialize it as an empty object
                    setProduct(p => ({...p, stock: {}}));
                }
            } else {
                toast.error('Product not found!');
                router.push('/admin/products');
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, [id, router]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setProduct({ ...product, [name]: value });
    };

    const handleStockChange = (size, value) => {
        const newStock = { ...(product.stock || {}), [size]: Number(value) };
        setProduct({ ...product, stock: newStock });
    };

    const handleImageChange = (index, value) => {
        // This logic needs to be careful with imageUrl vs images array
        const allImages = [product.imageUrl, ...(product.images || [])];
        allImages[index] = value;
        setProduct({ ...product, imageUrl: allImages[0], images: allImages.slice(1) });
    };

    const handleAddSize = () => {
        if (newSize && !(product.stock && product.stock.hasOwnProperty(newSize))) {
            const newStock = { ...(product.stock || {}), [newSize.toUpperCase()]: 0 };
            setProduct({ ...product, stock: newStock });
            setNewSize('');
        }
    };

    const handleRemoveSize = (size) => {
        const { [size]: _, ...rest } = (product.stock || {});
        setProduct({ ...product, stock: rest });
    };
    
    const handleSaveProduct = async () => {
        if (!product.name) {
            toast.error('Name is required.');
            return;
        }
        setSaving(true);
        try {
            const productRef = doc(db, 'products', id);
            const stockData = isSizeBased ? (product.stock || {}) : Number(product.stock || 0);
            const dataToSave = {
                ...product,
                price: Number(product.price || 0),
                discountPrice: product.discountPrice ? Number(product.discountPrice) : null,
                tags: Array.isArray(product.tags) ? product.tags : (product.tags || '').split(',').map(t => t.trim()),
                stock: stockData,
                updatedAt: serverTimestamp(),
            };
            await updateDoc(productRef, dataToSave);
            toast.success('Product updated successfully!');
            router.push('/admin/products');
        } catch (error) {
            toast.error('Failed to save product.');
            console.error("Error updating product: ", error);
        } finally {
            setSaving(false);
        }
    };

    if (loading || !product) return <div className="h-screen flex items-center justify-center"><p>Loading Product Editor...</p></div>;

    const allImages = [product.imageUrl, ...(product.images || [])].filter(Boolean);

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-10">
            <div className="max-w-4xl mx-auto">
                 <header className="mb-12 flex items-center gap-4">
                    <button onClick={() => router.back()} className="p-2 hover:bg-gray-200 rounded-full transition"><HiOutlineArrowLeft size={24}/></button>
                    <div><h1 className="text-3xl font-black uppercase tracking-tighter italic">Edit Creation</h1><p className="text-sm text-gray-400 font-bold tracking-widest mt-1">Refine the Zaqeen Universe</p></div>
                </header>

                <div className="space-y-8">
                     <div className="p-8 bg-white border border-gray-100 rounded-lg shadow-lg shadow-black/[0.02]">
                        <h2 className="text-lg font-bold tracking-tight mb-6 flex items-center gap-3"><HiOutlineSparkles/>Core Details</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2"><InputField icon={<HiOutlineCollection/>} name="name" placeholder="Product Name" value={product.name || ''} onChange={handleInputChange} /></div>
                            <InputField icon={<HiOutlineCurrencyDollar/>} name="price" placeholder="Original Price" value={product.price || ''} onChange={handleInputChange} type="number" />
                            <InputField icon={<HiOutlineTag/>} name="discountPrice" placeholder="Discount Price" value={product.discountPrice || ''} onChange={handleInputChange} type="number" />
                            <InputField icon={<HiOutlineTag/>} name="category" placeholder="Category" value={product.category || ''} onChange={handleInputChange} />
                            <div className="md:col-span-2"><InputField icon={<HiOutlineTag/>} name="tags" placeholder="Tags (comma-separated)" value={Array.isArray(product.tags) ? product.tags.join(', ') : (product.tags || '')} onChange={handleInputChange} /></div>
                            <InputField icon={<HiOutlineBackspace/>} name="sku" placeholder="SKU" value={product.sku || ''} onChange={handleInputChange} />
                             <div className="md:col-span-2">
                                <div className="relative"><textarea name="description" placeholder="Product Description" value={product.description || ''} onChange={handleInputChange} rows="4" className="w-full pl-4 pr-4 py-4 bg-white border border-gray-100 rounded-lg shadow-sm focus:ring-2 focus:ring-black/50 transition-all text-sm tracking-wide font-medium"></textarea></div>
                            </div>
                        </div>
                    </div>

                     <div className="p-8 bg-white border border-gray-100 rounded-lg shadow-lg shadow-black/[0.02]">
                        <h2 className="text-lg font-bold tracking-tight mb-6">Stock Management</h2>
                        <div className="flex items-center gap-4 mb-6">
                            <label className="flex items-center cursor-pointer"><input type="radio" name="stockType" checked={isSizeBased} onChange={() => setIsSizeBased(true)} className="mr-2"/><span className="text-sm font-bold">Size-based Stock</span></label>
                            <label className="flex items-center cursor-pointer"><input type="radio" name="stockType" checked={!isSizeBased} onChange={() => setIsSizeBased(false)} className="mr-2"/><span className="text-sm font-bold">Numeric Stock</span></label>
                        </div>
                        {isSizeBased ? (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <input type="text" value={newSize} onChange={(e) => setNewSize(e.target.value)} placeholder="Add Size (e.g., M)" className="w-full input"/>
                                    <button type="button" onClick={handleAddSize} className="p-3 bg-gray-200 rounded-lg hover:bg-gray-300"><HiOutlinePlus/></button>
                                </div>
                                {product.stock && typeof product.stock === 'object' && Object.keys(product.stock).map(size => (
                                    <div key={size} className="flex items-center gap-4 p-2 rounded-lg bg-gray-50/50">
                                        <span className="font-bold w-20 text-center">{size}</span>
                                        <input type="number" value={product.stock[size] || 0} onChange={(e) => handleStockChange(size, e.target.value)} className="w-full input" />
                                        <button type="button" onClick={() => handleRemoveSize(size)} className="p-2 text-rose-500 hover:bg-rose-100 rounded-full"><HiOutlineTrash/></button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <InputField icon={<HiOutlineCollection/>} name="stock" placeholder="Total Stock Quantity" value={product.stock || ''} onChange={handleInputChange} type="number" />
                        )}
                    </div>

                     <div className="p-8 bg-white border border-gray-100 rounded-lg shadow-lg shadow-black/[0.02]">
                        <h2 className="text-lg font-bold tracking-tight mb-6 flex items-center gap-3"><HiOutlinePhotograph/>Product Media</h2>
                        <div className="space-y-4">
                            {allImages.map((img, index) => (<InputField key={index} icon={<HiOutlinePhotograph/>} placeholder={`Image URL ${index + 1}`} value={img} onChange={(e) => handleImageChange(index, e.target.value)} />))}
                            <InputField icon={<HiOutlineVideoCamera/>} name="videoUrl" placeholder="Video URL" value={product.videoUrl || ''} onChange={handleInputChange} />
                        </div>
                    </div>

                    <div className="flex justify-end pt-6"><button onClick={handleSaveProduct} disabled={saving} className="bg-black text-white px-10 py-4 rounded-lg font-bold uppercase tracking-widest text-xs disabled:bg-gray-400">{saving ? 'Saving... ' : 'Save Changes'}</button></div>
                </div>
            </div>
        </div>
    );
};

const InputField = ({ icon, name, placeholder, value, onChange, type = "text" }) => (
    <div className="relative">
        {icon && <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">{icon}</div>}
        <input type={type} name={name} placeholder={placeholder} value={value} onChange={onChange}
            className={`w-full ${icon ? 'pl-12' : 'pl-4'} pr-4 py-4 bg-white border border-gray-100 rounded-lg shadow-sm focus:ring-2 focus:ring-black/50 transition-all text-sm tracking-wide font-medium`}/>
    </div>
);

export default ProductEditPage;

// Basic input styling, can be in a global css file.
// .input { @apply w-full p-3 bg-gray-100 border rounded-md focus:ring-2 focus:ring-black/50; }
