'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { updateDoc, doc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';

const ProductEditPage = () => {
    const [product, setProduct] = useState({
        name: '',
        description: '',
        price: '',
        discountPrice: '',
        category: '',
        subCategory: '',
        tags: '',
        sku: '',
        imageUrl: '',
        images: ['', '', ''],
        videoUrl: '',
        colors: []
    });
    
    const [newColor, setNewColor] = useState('');
    const [stock, setStock] = useState({ 'M': 0, 'L': 0, 'XL': 0 });
    const [isSizeBased, setIsSizeBased] = useState(true);
    const [numericStock, setNumericStock] = useState('');
    const [newSize, setNewSize] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [imagePreview, setImagePreview] = useState('');
    const [additionalPreviews, setAdditionalPreviews] = useState(['', '', '']);
    const [errors, setErrors] = useState({});
    const [activeSection, setActiveSection] = useState(1);

    const router = useRouter();
    const { id } = useParams();

    // ==================== FETCH DATA ====================
    useEffect(() => {
        if (!id) return;
        const docRef = doc(db, 'products', id);
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                
                // Firestore images array থেকে মেইন ইমেজ বাদে বাকিগুলো আলাদা করা
                const mainImg = data.images?.[0] || '';
                const otherImgs = data.images?.slice(1) || ['', '', ''];
                while(otherImgs.length < 3) otherImgs.push('');

                setProduct({
                    ...data,
                    imageUrl: mainImg,
                    images: otherImgs,
                    tags: Array.isArray(data.tags) ? data.tags.join(', ') : (data.tags || ''),
                    colors: data.colors || []
                });

                // Inventory State Setup
                if (typeof data.stock === 'number') {
                    setIsSizeBased(false);
                    setNumericStock(data.stock.toString());
                } else {
                    setIsSizeBased(true);
                    setStock(data.stock || { 'M': 0, 'L': 0, 'XL': 0 });
                }

                setImagePreview(mainImg);
                setAdditionalPreviews(otherImgs);
            } else {
                toast.error('Product not found!');
                router.push('/admin/products');
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, [id, router]);

    // ==================== HANDLERS ====================
    const handleChange = (e) => {
        const { name, value } = e.target;
        setProduct(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
        if (name === 'imageUrl') setImagePreview(value);
    };

    const handleImageChange = (index, value) => {
        const newImages = [...product.images];
        newImages[index] = value;
        setProduct(prev => ({ ...prev, images: newImages }));
        const newPreviews = [...additionalPreviews];
        newPreviews[index] = value;
        setAdditionalPreviews(newPreviews);
    };

    const handleAddColor = () => {
        if (newColor.trim()) {
            if (!product.colors.some(c => c.name === newColor.trim())) {
                setProduct(prev => ({
                    ...prev,
                    colors: [...prev.colors, { name: newColor.trim(), images: ['', '', ''] }]
                }));
                setNewColor('');
                toast.success('Color added');
            }
        }
    };

    const handleRemoveColor = (index) => {
        const updatedColors = product.colors.filter((_, i) => i !== index);
        setProduct(prev => ({ ...prev, colors: updatedColors }));
    };

    const handleColorImageChange = (colorIndex, imageIndex, value) => {
        const newColors = [...product.colors];
        newColors[colorIndex].images[imageIndex] = value;
        setProduct(prev => ({ ...prev, colors: newColors }));
    };

    const handleAddSize = () => {
        const upperSize = newSize.toUpperCase().trim();
        if (upperSize && !stock.hasOwnProperty(upperSize)) {
            setStock(prev => ({ ...prev, [upperSize]: 0 }));
            setNewSize('');
        }
    };

    const handleRemoveSize = (size) => {
        const newStock = { ...stock };
        delete newStock[size];
        setStock(newStock);
    };

    const validateForm = () => {
        const newErrors = {};
        if (!product.name.trim()) newErrors.name = 'Name is required';
        if (!product.price || product.price <= 0) newErrors.price = 'Valid price is required';
        if (!product.imageUrl.trim()) newErrors.imageUrl = 'Main image is required';
        if (!product.category.trim()) newErrors.category = 'Category is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // ==================== SUBMIT ====================
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setSubmitting(true);
        const loadingToast = toast.loading('Updating Product Architecture...');

        try {
            const finalImages = [product.imageUrl, ...product.images.filter(img => img.trim() !== '')];
            const stockData = isSizeBased ? stock : (parseInt(numericStock) || 0);

            const updatedData = {
                ...product,
                price: parseFloat(product.price),
                discountPrice: product.discountPrice ? parseFloat(product.discountPrice) : null,
                tags: product.tags.split(',').map(tag => tag.trim()).filter(t => t),
                stock: stockData,
                images: finalImages,
                updatedAt: serverTimestamp()
            };

            await updateDoc(doc(db, 'products', id), updatedData);
            toast.dismiss(loadingToast);
            toast.success('Identity Updated Successfully');
            router.push('/admin/products');
        } catch (error) {
            toast.dismiss(loadingToast);
            toast.error('Update Failed');
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    // ==================== UI COMPONENTS ====================
    const InputField = ({ icon, name, placeholder, value, onChange, type = "text", error, required = false }) => (
        <div className="space-y-2">
            <div className={`group relative transition-all ${error ? 'animate-shake' : ''}`}>
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-black transition-colors">
                    {icon}
                </div>
                <input 
                    type={type} name={name} placeholder={placeholder} value={value} onChange={onChange}
                    className={`w-full pl-12 pr-4 py-4 bg-white border ${error ? 'border-red-500' : 'border-gray-200'} focus:border-black outline-none transition-all text-[11px] font-bold uppercase tracking-wide placeholder:text-gray-300`}
                    required={required}
                />
            </div>
        </div>
    );

    const ImagePreviewCard = ({ url, label, onRemove }) => (
        <div className="relative group aspect-square bg-gray-100 border border-gray-200 overflow-hidden">
            {url ? (
                <img src={url} alt={label} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
            ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
            )}
            {url && (
                <button type="button" onClick={onRemove} className="absolute top-2 right-2 p-1 bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            )}
        </div>
    );

    if (loading) return <div className="min-h-screen flex items-center justify-center font-black uppercase tracking-widest">Synchronizing...</div>;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-4 md:p-12">
            <div className="max-w-5xl mx-auto">
                <header className="mb-12">
                    <span className="text-[10px] font-black uppercase tracking-[0.6em] text-gray-400">System / Editor</span>
                    <h1 className="text-4xl md:text-7xl font-black uppercase tracking-tighter mt-2">Modify Article</h1>
                    <p className="text-[11px] text-gray-500 font-bold mt-4 uppercase">Update technical specifications for {product.name}</p>
                </header>

                <form onSubmit={handleSubmit} className="space-y-16">
                    {/* SECTION 01: CORE */}
                    <div className="space-y-8">
                        <h2 className="text-[11px] font-black uppercase tracking-[0.3em] flex items-center gap-3">
                            <span className="w-8 h-8 bg-black text-white flex items-center justify-center">01</span> Core Data
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <InputField name="name" placeholder="Article Name" value={product.name} onChange={handleChange} error={errors.name} required />
                            </div>
                            <InputField name="price" type="number" placeholder="Base Price" value={product.price} onChange={handleChange} error={errors.price} required />
                            <InputField name="discountPrice" type="number" placeholder="Offer Price" value={product.discountPrice} onChange={handleChange} />
                            <InputField name="category" placeholder="Category" value={product.category} onChange={handleChange} required />
                            <InputField name="sku" placeholder="Stock Keeping Unit (SKU)" value={product.sku} onChange={handleChange} />
                            <div className="md:col-span-2">
                                <textarea 
                                    name="description" value={product.description} onChange={handleChange} rows="4" placeholder="Technical Description..."
                                    className="w-full p-4 bg-white border border-gray-200 focus:border-black outline-none text-[11px] font-bold uppercase tracking-wide"
                                />
                            </div>
                        </div>
                    </div>

                    {/* SECTION 02: INVENTORY */}
                    <div className="space-y-8">
                        <h2 className="text-[11px] font-black uppercase tracking-[0.3em] flex items-center gap-3">
                            <span className="w-8 h-8 bg-black text-white flex items-center justify-center">02</span> Inventory
                        </h2>
                        <div className="flex bg-gray-100 p-1">
                            <button type="button" onClick={() => setIsSizeBased(true)} className={`flex-1 py-3 text-[9px] font-black uppercase ${isSizeBased ? 'bg-black text-white' : 'text-gray-400'}`}>Size Matrix</button>
                            <button type="button" onClick={() => setIsSizeBased(false)} className={`flex-1 py-3 text-[9px] font-black uppercase ${!isSizeBased ? 'bg-black text-white' : 'text-gray-400'}`}>Bulk Stock</button>
                        </div>
                        {isSizeBased ? (
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                {Object.entries(stock).map(([size, qty]) => (
                                    <div key={size} className="bg-white border p-4 text-center">
                                        <div className="flex justify-between text-[10px] font-black mb-2"><span>{size}</span><button type="button" onClick={() => handleRemoveSize(size)}>×</button></div>
                                        <input type="number" value={qty} onChange={(e) => setStock({...stock, [size]: e.target.value})} className="w-full text-center font-black border-none focus:ring-0" />
                                    </div>
                                ))}
                                <div className="border-2 border-dashed p-4 flex flex-col gap-2">
                                    <input type="text" placeholder="NEW" value={newSize} onChange={(e) => setNewSize(e.target.value)} className="text-center text-[10px] uppercase font-black" />
                                    <button type="button" onClick={handleAddSize} className="bg-black text-white text-[8px] py-1 font-black">ADD</button>
                                </div>
                            </div>
                        ) : (
                            <InputField name="numericStock" type="number" placeholder="Total Units" value={numericStock} onChange={(e) => setNumericStock(e.target.value)} />
                        )}
                    </div>

                    {/* SECTION 03: COLORS */}
                    <div className="space-y-8">
                        <h2 className="text-[11px] font-black uppercase tracking-[0.3em] flex items-center gap-3">
                            <span className="w-8 h-8 bg-black text-white flex items-center justify-center">03</span> Chromatics
                        </h2>
                        <div className="flex gap-4">
                            <input value={newColor} onChange={(e) => setNewColor(e.target.value)} placeholder="Color ID" className="flex-1 p-4 border text-[11px] font-black uppercase" />
                            <button type="button" onClick={handleAddColor} className="bg-black text-white px-8 font-black text-[10px] uppercase">Append</button>
                        </div>
                        <div className="space-y-6">
                            {product.colors.map((color, cIdx) => (
                                <div key={cIdx} className="border p-6 space-y-4">
                                    <div className="flex justify-between font-black uppercase text-sm"><span>{color.name}</span><button type="button" onClick={() => handleRemoveColor(cIdx)} className="text-red-500">Remove</button></div>
                                    <div className="grid grid-cols-3 gap-4">
                                        {color.images.map((img, iIdx) => (
                                            <div key={iIdx} className="space-y-2">
                                                <ImagePreviewCard url={img} onRemove={() => handleColorImageChange(cIdx, iIdx, '')} />
                                                <input value={img} onChange={(e) => handleColorImageChange(cIdx, iIdx, e.target.value)} placeholder="URL" className="w-full text-[8px] border p-1" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* SECTION 04: VISUALS */}
                    <div className="space-y-8">
                        <h2 className="text-[11px] font-black uppercase tracking-[0.3em] flex items-center gap-3">
                            <span className="w-8 h-8 bg-black text-white flex items-center justify-center">04</span> Media
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <ImagePreviewCard url={imagePreview} label="Primary" onRemove={() => { setProduct({...product, imageUrl: ''}); setImagePreview(''); }} />
                            {additionalPreviews.map((url, i) => (
                                <ImagePreviewCard key={i} url={url} label={`Asset ${i+2}`} onRemove={() => handleImageChange(i, '')} />
                            ))}
                        </div>
                        <div className="space-y-4">
                            <InputField name="imageUrl" placeholder="Hero Asset URL" value={product.imageUrl} onChange={handleChange} error={errors.imageUrl} />
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {product.images.map((img, i) => (
                                    <input key={i} value={img} onChange={(e) => handleImageChange(i, e.target.value)} placeholder={`Gallery Asset ${i+1}`} className="p-4 border text-[11px] font-black" />
                                ))}
                            </div>
                        </div>
                    </div>

                    <button 
                        type="submit" disabled={submitting}
                        className="w-full bg-black text-white py-8 text-[11px] font-black uppercase tracking-[0.5em] hover:bg-neutral-900 transition-all disabled:opacity-50"
                    >
                        {submitting ? 'Updating System...' : 'Commit Changes to Catalog'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ProductEditPage;