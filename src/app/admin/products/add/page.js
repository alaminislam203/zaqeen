'use client';
import { useState, useRef } from 'react';
import { db } from '@/lib/firebase';
import { collection, serverTimestamp, setDoc, doc } from 'firebase/firestore';
import toast from 'react-hot-toast';

// AI API function
const generateWithAI = async (prompt) => {
    try {
        console.log('AI Request:', prompt);
        const response = await fetch(`https://rabby-gemini-ai.vercel.app/api?ai=${encodeURIComponent(prompt)}`);
        console.log('AI Response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('AI API Error:', response.status, errorText);
            throw new Error(`AI request failed: ${response.status}`);
        }

        const data = await response.json();
        console.log('AI Response data:', data);

        // Try different possible response formats
        const result = data.response || data.text || data.content || data.message || data.result;
        if (result) {
            return result;
        } else {
            console.warn('Unexpected AI response format:', data);
            return 'AI response unavailable - unexpected format';
        }
    } catch (error) {
        console.error('AI Error:', error);
        throw error;
    }
};

const AddProductPage = () => {
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
    const [colorImages, setColorImages] = useState(['', '', '']);
    const [stock, setStock] = useState({ 'M': 0, 'L': 0, 'XL': 0 });
    const [isSizeBased, setIsSizeBased] = useState(true);
    const [numericStock, setNumericStock] = useState('');
    const [newSize, setNewSize] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [imagePreview, setImagePreview] = useState('');
    const [additionalPreviews, setAdditionalPreviews] = useState(['', '', '']);
    const [errors, setErrors] = useState({});
    const [activeSection, setActiveSection] = useState(1);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProduct(prev => ({ ...prev, [name]: value }));
        
        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }

        // Live preview for main image
        if (name === 'imageUrl') {
            setImagePreview(value);
        }
    };

    const handleImageChange = (index, value) => {
        const newImages = [...product.images];
        newImages[index] = value;
        setProduct(prev => ({ ...prev, images: newImages }));

        // Update preview
        const newPreviews = [...additionalPreviews];
        newPreviews[index] = value;
        setAdditionalPreviews(newPreviews);
    };

    const handleAddColor = () => {
        if (newColor.trim()) {
            const colorName = newColor.trim();
            if (!product.colors.some(c => c.name === colorName)) {
                setProduct(prev => ({
                    ...prev,
                    colors: [...prev.colors, { name: colorName, images: ['', '', ''] }]
                }));
                setNewColor('');
                toast.success(`Color ${colorName} added`, {
                    style: { borderRadius: '0px', background: '#000', color: '#fff', fontSize: '10px' }
                });
            }
        }
    };

    const handleRemoveColor = (colorIndex) => {
        setProduct(prev => ({
            ...prev,
            colors: prev.colors.filter((_, index) => index !== colorIndex)
        }));
        toast.success('Color removed', {
            style: { borderRadius: '0px', background: '#000', color: '#fff', fontSize: '10px' }
        });
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
            toast.success(`Size ${upperSize} added`, {
                style: { borderRadius: '0px', background: '#000', color: '#fff', fontSize: '10px' }
            });
        }
    };

    const handleRemoveSize = (size) => {
        const newStock = { ...stock };
        delete newStock[size];
        setStock(newStock);
        toast.success(`Size ${size} removed`, {
            style: { borderRadius: '0px', background: '#000', color: '#fff', fontSize: '10px' }
        });
    };

    const handleStockChange = (size, value) => {
        setStock(prev => ({ ...prev, [size]: Math.max(0, parseInt(value) || 0) }));
    };

    const validateForm = () => {
        const newErrors = {};

        if (!product.name.trim()) newErrors.name = 'Product name is required';
        if (!product.price || parseFloat(product.price) <= 0) newErrors.price = 'Valid price is required';
        if (!product.imageUrl.trim()) newErrors.imageUrl = 'Main image URL is required';
        if (!product.category.trim()) newErrors.category = 'Category is required';
        
        if (product.discountPrice && parseFloat(product.discountPrice) >= parseFloat(product.price)) {
            newErrors.discountPrice = 'Discount price must be less than base price';
        }

        if (!isSizeBased && (!numericStock || parseInt(numericStock) <= 0)) {
            newErrors.numericStock = 'Stock quantity is required';
        }

        if (isSizeBased && Object.values(stock).every(val => val === 0)) {
            newErrors.stock = 'At least one size must have stock';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            toast.error('Please fix all errors before submitting', {
                style: { borderRadius: '0px', background: '#ef4444', color: '#fff' }
            });
            return;
        }

        setSubmitting(true);
        const loadingToast = toast.loading('Creating product...');

        try {
            const finalImages = [product.imageUrl, ...product.images.filter(img => img.trim() !== '')];
            const stockData = isSizeBased ? stock : (parseInt(numericStock) || 0);

            const productData = {
                ...product,
                price: parseFloat(product.price),
                discountPrice: product.discountPrice ? parseFloat(product.discountPrice) : null,
                tags: product.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== ''),
                stock: stockData,
                images: finalImages,
                createdAt: serverTimestamp(),
                viewCount: 0,
                salesCount: 0,
                status: 'published',
                featured: false
            };

            // Create a sanitized document ID from the product name
            const sanitizedId = product.name.trim().toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
            const productRef = doc(db, 'products', sanitizedId);

            await setDoc(productRef, productData);
            
            toast.dismiss(loadingToast);
            toast.success('Product created successfully!', {
                style: { borderRadius: '0px', background: '#10b981', color: '#fff' }
            });

            // Reset form
            setProduct({
                name: '', description: '', price: '', discountPrice: '',
                category: '', subCategory: '', tags: '', sku: '', imageUrl: '',
                images: ['', '', ''], videoUrl: ''
            });
            setStock({ 'M': 0, 'L': 0, 'XL': 0 });
            setNumericStock('');
            setImagePreview('');
            setAdditionalPreviews(['', '', '']);
            setErrors({});
            setActiveSection(1);

        } catch (error) { 
            toast.dismiss(loadingToast);
            toast.error('Failed to create product. Please try again.');
            console.error("Error adding product: ", error);
        } finally {
            setSubmitting(false);
        }
    };

    // Enhanced Input Component
    const InputField = ({ icon, name, placeholder, value, onChange, type = "text", error, required = false }) => (
        <div className="space-y-2">
            <div className={`group relative transition-all ${error ? 'animate-shake' : ''}`}>
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-black transition-colors">
                    {icon}
                </div>
                <input 
                    type={type} 
                    name={name} 
                    placeholder={placeholder} 
                    value={value} 
                    onChange={onChange}
                    className={`w-full pl-12 pr-4 py-4 bg-white border ${
                        error ? 'border-red-500' : 'border-gray-200'
                    } focus:border-black outline-none transition-all text-[11px] font-bold uppercase tracking-wide placeholder:text-gray-300 hover:border-gray-300`}
                    required={required}
                />
                {required && (
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                        <span className="text-red-500 text-sm">*</span>
                    </div>
                )}
            </div>
            {error && (
                <p className="text-[9px] text-red-500 font-bold uppercase tracking-wide flex items-center gap-1 ml-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {error}
                </p>
            )}
        </div>
    );

    // Image Preview Component
    const ImagePreviewCard = ({ url, label, onRemove }) => (
        <div className="relative group">
            <div className="aspect-square bg-gray-100 border border-gray-200 overflow-hidden">
                {url ? (
                    <img 
                        src={url} 
                        alt={label} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        onError={(e) => {
                            e.target.src = '/placeholder.png';
                            e.target.classList.add('opacity-50');
                        }}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-12 h-12 text-gray-300" fill="none" strokeWidth="1.5" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                        </svg>
                    </div>
                )}
            </div>
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                <p className="text-white text-[9px] font-black uppercase tracking-wider">{label}</p>
            </div>
            {url && onRemove && (
                <button
                    type="button"
                    onClick={onRemove}
                    className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                >
                    <svg className="w-4 h-4" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            )}
        </div>
    );

    // Section Progress Indicator
    const SectionIndicator = ({ number, title, active, completed }) => (
        <div className={`flex items-center gap-3 transition-all ${active ? 'opacity-100' : 'opacity-40'}`}>
            <div className={`w-8 h-8 flex items-center justify-center font-black text-[10px] transition-all ${
                completed ? 'bg-green-500 text-white' : 
                active ? 'bg-black text-white' : 
                'bg-gray-200 text-gray-400'
            }`}>
                {completed ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                ) : number}
            </div>
            <span className="text-[9px] font-black uppercase tracking-wide">{title}</span>
        </div>
    );

    // Calculate completion
    const section1Complete = product.name && product.price && product.category;
    const section2Complete = isSizeBased ? Object.values(stock).some(v => v > 0) : numericStock > 0;
    const section3Complete = product.imageUrl;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-4 md:p-8 lg:p-12 selection:bg-black selection:text-white">
            <div className="max-w-5xl mx-auto">
                
                {/* Enhanced Header */}
                <header className="mb-12 relative">
                    <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-black/5 to-transparent rounded-full blur-3xl"></div>
                    <div className="relative z-10 space-y-3 mb-8">
                        <span className="text-[10px] font-black uppercase tracking-[0.6em] text-gray-400 block">Product Architecture</span>
                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black uppercase tracking-tighter">Create Article</h1>
                        <p className="text-[11px] text-gray-500 tracking-wide font-bold">Build and configure your product identity</p>
                    </div>

                    {/* Progress Indicators */}
                    <div className="flex flex-wrap gap-6 pb-6 border-b border-gray-200">
                        <SectionIndicator number="01" title="Core Data" active={activeSection === 1} completed={section1Complete} />
                        <SectionIndicator number="02" title="Inventory" active={activeSection === 2} completed={section2Complete} />
                        <SectionIndicator number="03" title="Colors" active={activeSection === 3} completed={product.colors.length > 0} />
                        <SectionIndicator number="04" title="Media" active={activeSection === 4} completed={section3Complete} />
                    </div>
                </header>

                <form onSubmit={handleSubmit} className="space-y-12">
                    
                    {/* Section 01: Core Blueprint */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-[11px] font-black uppercase tracking-[0.3em] flex items-center gap-2">
                                <div className="w-6 h-6 bg-black text-white flex items-center justify-center text-[10px] font-black">01</div>
                                Core Blueprint
                            </h2>
                            {section1Complete && (
                                <span className="text-[9px] font-black uppercase tracking-wide text-green-600 flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    Complete
                                </span>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <InputField 
                                    icon={
                                        <svg className="w-5 h-5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                                        </svg>
                                    }
                                    name="name" 
                                    placeholder="Product Name" 
                                    value={product.name} 
                                    onChange={handleChange}
                                    error={errors.name}
                                    required
                                />
                            </div>

                            <InputField 
                                icon={
                                    <svg className="w-5 h-5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                                    </svg>
                                }
                                name="price" 
                                placeholder="Base Price (৳)" 
                                value={product.price} 
                                onChange={handleChange} 
                                type="number"
                                error={errors.price}
                                required
                            />

                            <InputField 
                                icon={
                                    <svg className="w-5 h-5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0c1.1.128 1.907 1.077 1.907 2.185zM9.75 9h.008v.008H9.75V9zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 4.5h.008v.008h-.008V13.5zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                                    </svg>
                                }
                                name="discountPrice" 
                                placeholder="Sale Price (Optional)" 
                                value={product.discountPrice} 
                                onChange={handleChange} 
                                type="number"
                                error={errors.discountPrice}
                            />

                            <InputField
                                icon={
                                    <svg className="w-5 h-5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
                                    </svg>
                                }
                                name="category"
                                placeholder="Category"
                                value={product.category}
                                onChange={handleChange}
                                error={errors.category}
                                required
                            />

                            <InputField
                                icon={
                                    <svg className="w-5 h-5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z" />
                                    </svg>
                                }
                                name="subCategory"
                                placeholder="Sub Category (Optional)"
                                value={product.subCategory}
                                onChange={handleChange}
                            />

                            <InputField 
                                icon={
                                    <svg className="w-5 h-5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z" />
                                    </svg>
                                }
                                name="sku" 
                                placeholder="SKU / Product Code" 
                                value={product.sku} 
                                onChange={handleChange}
                            />

                            <div className="md:col-span-2">
                                <InputField 
                                    icon={
                                        <svg className="w-5 h-5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
                                        </svg>
                                    }
                                    name="tags" 
                                    placeholder="Tags (comma separated: men, casual, summer)" 
                                    value={product.tags} 
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="md:col-span-2 space-y-2">
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-[9px] font-black uppercase tracking-wide text-gray-500">Product Description</label>
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            if (!product.name.trim()) {
                                                toast.error('Please enter a product name first', {
                                                    style: { borderRadius: '0px', background: '#ef4444', color: '#fff', fontSize: '10px' }
                                                });
                                                return;
                                            }
                                            try {
                                                const prompt = `Generate a compelling product description for "${product.name}" in the ${product.category || 'fashion'} category. Make it engaging, highlight key features, and keep it under 200 words.`;
                                                const aiDescription = await generateWithAI(prompt);
                                                setProduct(prev => ({ ...prev, description: aiDescription }));
                                                toast.success('Description generated!', {
                                                    style: { borderRadius: '0px', background: '#10b981', color: '#fff', fontSize: '10px' }
                                                });
                                            } catch (error) {
                                                toast.error('Failed to generate description', {
                                                    style: { borderRadius: '0px', background: '#ef4444', color: '#fff', fontSize: '10px' }
                                                });
                                            }
                                        }}
                                        className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-[9px] font-black uppercase tracking-wide hover:from-blue-600 hover:to-purple-700 transition-all"
                                    >
                                        <svg className="w-4 h-4" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                        </svg>
                                        AI Generate
                                    </button>
                                </div>
                                <div className="relative group">
                                    <div className="absolute top-4 left-4 pointer-events-none text-gray-400 group-focus-within:text-black transition-colors">
                                        <svg className="w-5 h-5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                                        </svg>
                                    </div>
                                    <textarea
                                        name="description"
                                        placeholder="Product Description..."
                                        value={product.description}
                                        onChange={handleChange}
                                        rows="5"
                                        className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 focus:border-black outline-none transition-all text-[11px] font-bold tracking-wide placeholder:text-gray-300 resize-none hover:border-gray-300"
                                    ></textarea>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 02: Inventory */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-[11px] font-black uppercase tracking-[0.3em] flex items-center gap-2">
                                <div className="w-6 h-6 bg-black text-white flex items-center justify-center text-[10px] font-black">02</div>
                                Inventory Management
                            </h2>
                            {section2Complete && (
                                <span className="text-[9px] font-black uppercase tracking-wide text-green-600 flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    Complete
                                </span>
                            )}
                        </div>

                        {/* Stock Type Toggle */}
                        <div className="flex gap-2 bg-gray-100 p-1">
                            {[
                                { id: true, label: 'Size-based Stock', icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z' },
                                { id: false, label: 'Total Stock', icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z' }
                            ].map(type => (
                                <button
                                    key={type.id.toString()}
                                    type="button"
                                    onClick={() => setIsSizeBased(type.id)}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-[9px] font-black uppercase tracking-wider transition-all ${
                                        isSizeBased === type.id 
                                            ? 'bg-black text-white' 
                                            : 'bg-transparent text-gray-400 hover:text-black'
                                    }`}
                                >
                                    <svg className="w-4 h-4" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d={type.icon} />
                                    </svg>
                                    {type.label}
                                </button>
                            ))}
                        </div>

                        {isSizeBased ? (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                    {Object.entries(stock).map(([size, quantity]) => (
                                        <div key={size} className="group relative bg-white border border-gray-200 hover:border-black transition-all p-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[11px] font-black uppercase">{size}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveSize(size)}
                                                    className="text-gray-300 hover:text-red-500 transition-colors"
                                                >
                                                    <svg className="w-4 h-4" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                            <input 
                                                type="number" 
                                                value={quantity} 
                                                onChange={(e) => handleStockChange(size, e.target.value)} 
                                                className="w-full bg-gray-50 border border-gray-200 focus:border-black outline-none text-center text-lg font-black py-2"
                                                min="0"
                                            />
                                            <p className="text-[8px] text-gray-400 uppercase tracking-wide text-center mt-2">units</p>
                                        </div>
                                    ))}
                                    
                                    {/* Add New Size */}
                                    <div className="bg-gray-50 border-2 border-dashed border-gray-300 hover:border-black transition-all p-4 flex flex-col items-center justify-center gap-2">
                                        <input 
                                            type="text" 
                                            value={newSize} 
                                            onChange={(e) => setNewSize(e.target.value)} 
                                            placeholder="XXL" 
                                            className="w-full bg-white border border-gray-200 focus:border-black outline-none text-center text-[11px] font-black uppercase py-2"
                                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSize())}
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAddSize}
                                            className="w-full bg-black text-white py-2 text-[9px] font-black uppercase tracking-wider hover:bg-neutral-800 transition-colors flex items-center justify-center gap-1"
                                        >
                                            <svg className="w-4 h-4" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                            </svg>
                                            Add
                                        </button>
                                    </div>
                                </div>
                                {errors.stock && (
                                    <p className="text-[9px] text-red-500 font-bold uppercase tracking-wide flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                        {errors.stock}
                                    </p>
                                )}
                            </div>
                        ) : (
                            <InputField 
                                icon={
                                    <svg className="w-5 h-5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                    </svg>
                                }
                                placeholder="Total Stock Quantity" 
                                value={numericStock} 
                                onChange={(e) => setNumericStock(e.target.value)} 
                                type="number"
                                error={errors.numericStock}
                                required
                            />
                        )}
                    </div>

                    {/* Section 03: Color Variants */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-[11px] font-black uppercase tracking-[0.3em] flex items-center gap-2">
                                <div className="w-6 h-6 bg-black text-white flex items-center justify-center text-[10px] font-black">03</div>
                                Color Variants
                            </h2>
                            {product.colors.length > 0 && (
                                <span className="text-[9px] font-black uppercase tracking-wide text-green-600 flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    {product.colors.length} Colors Added
                                </span>
                            )}
                        </div>

                        {/* Add Color Input */}
                        <div className="flex gap-4">
                            <InputField
                                icon={
                                    <svg className="w-5 h-5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                                    </svg>
                                }
                                placeholder="Color Name (e.g., Red, Blue)"
                                value={newColor}
                                onChange={(e) => setNewColor(e.target.value)}
                            />
                            <button
                                type="button"
                                onClick={handleAddColor}
                                className="px-6 py-4 bg-black text-white text-[11px] font-black uppercase tracking-wide hover:bg-neutral-800 transition-colors flex items-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                </svg>
                                Add Color
                            </button>
                        </div>

                        {/* Color List */}
                        {product.colors.length > 0 && (
                            <div className="space-y-4">
                                {product.colors.map((color, colorIndex) => (
                                    <div key={colorIndex} className="border border-gray-200 p-6 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-lg font-black uppercase tracking-wide">{color.name}</h3>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveColor(colorIndex)}
                                                className="text-red-500 hover:text-red-700 transition-colors"
                                            >
                                                <svg className="w-5 h-5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>

                                        {/* Color Images */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            {color.images.map((imageUrl, imageIndex) => (
                                                <div key={imageIndex} className="relative">
                                                    <ImagePreviewCard
                                                        url={imageUrl}
                                                        label={`${color.name} ${imageIndex + 1}`}
                                                        onRemove={() => handleColorImageChange(colorIndex, imageIndex, '')}
                                                    />
                                                </div>
                                            ))}
                                        </div>

                                        {/* Add Color Images */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {color.images.map((imageUrl, imageIndex) => (
                                                <InputField
                                                    key={imageIndex}
                                                    icon={
                                                        <svg className="w-5 h-5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                                                        </svg>
                                                    }
                                                    placeholder={`${color.name} Image ${imageIndex + 1}`}
                                                    value={imageUrl}
                                                    onChange={(e) => handleColorImageChange(colorIndex, imageIndex, e.target.value)}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Section 04: Media Assets */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-[11px] font-black uppercase tracking-[0.3em] flex items-center gap-2">
                                <div className="w-6 h-6 bg-black text-white flex items-center justify-center text-[10px] font-black">04</div>
                                Visual Assets
                            </h2>
                            {section3Complete && (
                                <span className="text-[9px] font-black uppercase tracking-wide text-green-600 flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    Complete
                                </span>
                            )}
                        </div>

                        {/* Image Previews */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <ImagePreviewCard 
                                url={imagePreview} 
                                label="Primary" 
                                onRemove={() => {
                                    setProduct(prev => ({ ...prev, imageUrl: '' }));
                                    setImagePreview('');
                                }}
                            />
                            {additionalPreviews.map((url, index) => (
                                <ImagePreviewCard 
                                    key={index}
                                    url={url} 
                                    label={`View ${index + 2}`}
                                    onRemove={() => handleImageChange(index, '')}
                                />
                            ))}
                        </div>

                        {/* Image URLs */}
                        <div className="space-y-4">
                            <InputField 
                                icon={
                                    <svg className="w-5 h-5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                                    </svg>
                                }
                                name="imageUrl" 
                                placeholder="Primary Image URL" 
                                value={product.imageUrl} 
                                onChange={handleChange}
                                error={errors.imageUrl}
                                required
                            />
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {product.images.map((img, index) => (
                                    <InputField 
                                        key={index}
                                        icon={
                                            <svg className="w-5 h-5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                                            </svg>
                                        }
                                        placeholder={`Additional Image ${index + 1}`} 
                                        value={img} 
                                        onChange={(e) => handleImageChange(index, e.target.value)}
                                    />
                                ))}
                            </div>

                            <InputField 
                                icon={
                                    <svg className="w-5 h-5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z" />
                                    </svg>
                                }
                                name="videoUrl" 
                                placeholder="Product Video URL (Optional)" 
                                value={product.videoUrl} 
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-8 space-y-4">
                        <button 
                            type="submit" 
                            disabled={submitting} 
                            className="group relative w-full bg-black text-white py-6 text-[11px] font-black uppercase tracking-[0.4em] overflow-hidden transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-2xl"
                        >
                            <span className="relative z-10 flex items-center justify-center gap-3">
                                {submitting ? (
                                    <>
                                        <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Creating Product...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5 group-hover:-translate-y-1 transition-transform" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                                        </svg>
                                        Publish to Catalog
                                    </>
                                )}
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-neutral-800 to-neutral-900 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                        </button>

                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wide text-center">
                            <svg className="w-3 h-3 inline-block mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            All fields marked with * are required
                        </p>
                    </div>
                </form>
            </div>

            {/* Custom Styles */}
            <style jsx>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }
                .animate-shake {
                    animation: shake 0.3s ease-in-out;
                }
            `}</style>
        </div>
    );
};

export default AddProductPage;