'use client';
import { useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { 
    HiOutlineUpload, HiOutlinePhotograph, HiOutlineVideoCamera, 
    HiOutlineTag, HiOutlineCurrencyDollar, HiOutlineCollection, 
    HiOutlineSparkles, HiOutlineBackspace, HiOutlinePlus, HiOutlineTrash 
} from 'react-icons/hi';

const AddProductPage = () => {
    const [product, setProduct] = useState({
        name: '',
        description: '',
        price: '',
        discountPrice: '',
        category: '',
        tags: '',
        sku: '',
        imageUrl: '',
        images: ['', '', ''],
        videoUrl: ''
    });
    const [stock, setStock] = useState({ 'M': 0, 'L': 0, 'XL': 0 }); // ডিফল্ট সাইজ রাখা হয়েছে
    const [isSizeBased, setIsSizeBased] = useState(true);
    const [numericStock, setNumericStock] = useState('');
    const [newSize, setNewSize] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProduct(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (index, value) => {
        const newImages = [...product.images];
        newImages[index] = value;
        setProduct(prev => ({ ...prev, images: newImages }));
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

    const handleStockChange = (size, value) => {
        setStock(prev => ({ ...prev, [size]: Math.max(0, parseInt(value) || 0) }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // ভ্যালিডেশন
        if (!product.name || !product.price || !product.imageUrl) {
            toast.error('Identity Audit Failed: Name, Price, and Main Asset are required.', {
                style: { borderRadius: '0px', background: '#000', color: '#fff' }
            });
            return;
        }

        setSubmitting(true);
        const loadingToast = toast.loading('Syncing with Zaqeen Protocol...');

        try {
            // ডাটা প্রসেসিং
            const finalImages = [product.imageUrl, ...product.images.filter(img => img.trim() !== '')];
            const stockData = isSizeBased ? stock : (parseInt(numericStock) || 0);

            const productData = {
                ...product,
                price: parseFloat(product.price),
                discountPrice: product.discountPrice ? parseFloat(product.discountPrice) : null,
                tags: product.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== ''),
                stock: stockData,
                images: finalImages,
                createdAt: serverTimestamp(), // Firebase Server Timestamp ব্যবহার করা ভালো
                viewCount: 0,
                salesCount: 0,
                status: 'published'
            };

            await addDoc(collection(db, 'products'), productData);
            
            toast.dismiss(loadingToast);
            toast.success('Creation Logged: Product live in gallery.', {
                style: { borderRadius: '0px', background: '#000', color: '#fff' }
            });

            // ফর্ম রিসেট
            setProduct({ name: '', description: '', price: '', discountPrice: '', category: '', tags: '', sku: '', imageUrl: '', images: ['', '', ''], videoUrl: '' });
            setStock({ 'M': 0, 'L': 0, 'XL': 0 });
            setNumericStock('');

        } catch (error) { 
            toast.dismiss(loadingToast);
            toast.error('Transmission Breach: Check console for logs.');
            console.error("Error adding product: ", error);
        } finally {
            setSubmitting(false);
        }
    };

    // প্রিমিয়াম ইনপুট ফিল্ড কম্পোনেন্ট
    const InputField = ({ icon, name, placeholder, value, onChange, type = "text" }) => (
        <div className="group relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-300 group-focus-within:text-black transition-colors">{icon}</div>
            <input 
                type={type} 
                name={name} 
                placeholder={placeholder} 
                value={value} 
                onChange={onChange}
                className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-sm focus:border-black outline-none transition-all text-[11px] font-black uppercase tracking-widest placeholder:text-gray-200" 
            />
        </div>
    );

    return (
        <div className="min-h-screen bg-[#FDFDFD] p-6 sm:p-12 selection:bg-black selection:text-white">
            <div className="max-w-4xl mx-auto">
                <header className="mb-20">
                    <span className="text-[10px] font-black uppercase tracking-[0.6em] text-gray-300 block mb-2 italic">Architecture</span>
                    <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter italic">Create New Article</h1>
                </header>

                <form onSubmit={handleSubmit} className="space-y-12">
                    {/* Core Blueprint */}
                    <div className="space-y-8">
                        <div className="flex items-center gap-4 pb-4 border-b border-gray-50">
                            <span className="text-[10px] font-black uppercase tracking-widest">01. Core Blueprint</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <InputField icon={<HiOutlineCollection/>} name="name" placeholder="Article Name" value={product.name} onChange={handleChange} />
                            </div>
                            <InputField icon={<HiOutlineCurrencyDollar/>} name="price" placeholder="Base Price (BDT)" value={product.price} onChange={handleChange} type="number" />
                            <InputField icon={<HiOutlineTag/>} name="discountPrice" placeholder="Acquisition Price (Optional)" value={product.discountPrice} onChange={handleChange} type="number" />
                            <InputField icon={<HiOutlineTag/>} name="category" placeholder="Category Archive" value={product.category} onChange={handleChange} />
                            <InputField icon={<HiOutlineBackspace/>} name="sku" placeholder="Reference SKU" value={product.sku} onChange={handleChange} />
                            <div className="md:col-span-2">
                                <InputField icon={<HiOutlineTag/>} name="tags" placeholder="Keywords (Comma Separated)" value={product.tags} onChange={handleChange} />
                            </div>
                            <div className="md:col-span-2">
                                <textarea 
                                    name="description" 
                                    placeholder="Technical Narrative..." 
                                    value={product.description} 
                                    onChange={handleChange} 
                                    rows="5" 
                                    className="w-full px-6 py-5 bg-white border border-gray-100 rounded-sm focus:border-black outline-none transition-all text-[11px] font-black uppercase tracking-widest placeholder:text-gray-200 italic"
                                ></textarea>
                            </div>
                        </div>
                    </div>

                    {/* Logistics & Stock */}
                    <div className="space-y-8">
                        <div className="flex items-center gap-4 pb-4 border-b border-gray-50">
                            <span className="text-[10px] font-black uppercase tracking-widest">02. Inventory Logistics</span>
                        </div>
                        <div className="flex gap-8 mb-8">
                            {['Size-based', 'Numeric'].map((type) => (
                                <button 
                                    key={type}
                                    type="button"
                                    onClick={() => setIsSizeBased(type === 'Size-based')}
                                    className={`text-[9px] font-black uppercase tracking-[0.3em] pb-1 border-b-2 transition-all ${((isSizeBased && type === 'Size-based') || (!isSizeBased && type === 'Numeric')) ? 'border-black text-black' : 'border-transparent text-gray-300'}`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>

                        {isSizeBased ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                {Object.keys(stock).map(size => (
                                    <div key={size} className="flex items-center border border-gray-50 p-2 group hover:border-black transition-colors">
                                        <span className="text-[10px] font-black w-12 text-center">{size}</span>
                                        <input 
                                            type="number" 
                                            value={stock[size]} 
                                            onChange={(e) => handleStockChange(size, e.target.value)} 
                                            className="w-full bg-transparent outline-none text-[11px] font-bold px-2" 
                                        />
                                        <button type="button" onClick={() => handleRemoveSize(size)} className="p-2 text-gray-200 hover:text-rose-500 transition-colors"><HiOutlineTrash/></button>
                                    </div>
                                ))}
                                <div className="flex items-center border border-dashed border-gray-200 p-2">
                                    <input 
                                        type="text" 
                                        value={newSize} 
                                        onChange={(e) => setNewSize(e.target.value)} 
                                        placeholder="NEW" 
                                        className="w-full bg-transparent outline-none text-[10px] font-black uppercase px-2"
                                    />
                                    <button type="button" onClick={handleAddSize} className="p-2 hover:bg-black hover:text-white transition-all"><HiOutlinePlus/></button>
                                </div>
                            </div>
                        ) : (
                            <InputField icon={<HiOutlineCollection/>} name="numericStock" placeholder="Total Unit Count" value={numericStock} onChange={(e) => setNumericStock(e.target.value)} type="number" />
                        )}
                    </div>

                    {/* Visual Assets */}
                    <div className="space-y-8">
                        <div className="flex items-center gap-4 pb-4 border-b border-gray-50">
                            <span className="text-[10px] font-black uppercase tracking-widest">03. Visual Assets</span>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            <InputField icon={<HiOutlinePhotograph/>} name="imageUrl" placeholder="Primary Visual URL *" value={product.imageUrl} onChange={handleChange} />
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {product.images.map((img, index) => (
                                    <InputField key={index} icon={<HiOutlinePhotograph/>} placeholder={`Perspective ${index + 1}`} value={img} onChange={(e) => handleImageChange(index, e.target.value)} />
                                ))}
                            </div>
                            <InputField icon={<HiOutlineVideoCamera/>} name="videoUrl" placeholder="Motion Asset URL (MP4/YouTube)" value={product.videoUrl} onChange={handleChange} />
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={submitting} 
                        className="w-full bg-black text-white py-8 text-[11px] font-black uppercase tracking-[0.5em] group overflow-hidden relative active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                        <span className="relative z-10 flex items-center justify-center gap-4">
                            {submitting ? 'Archiving...' : 'Publish to Gallery'}
                            <HiOutlineUpload size={18} className="group-hover:-translate-y-1 transition-transform" />
                        </span>
                        <div className="absolute inset-0 bg-neutral-900 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AddProductPage;
