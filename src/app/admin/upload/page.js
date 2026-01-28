'use client';
import { useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { HiOutlineUpload, HiOutlinePhotograph, HiOutlineVideoCamera, HiOutlineTag, HiOutlineCurrencyDollar, HiOutlineCollection, HiOutlineSparkles, HiOutlineBackspace, HiOutlinePlus, HiOutlineTrash } from 'react-icons/hi';

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
    const [stock, setStock] = useState({});
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
        if (newSize && !stock.hasOwnProperty(newSize)) {
            setStock(prev => ({ ...prev, [newSize.toUpperCase()]: 0 }));
            setNewSize('');
        }
    };

    const handleRemoveSize = (size) => {
        const newStock = { ...stock };
        delete newStock[size];
        setStock(newStock);
    };

    const handleStockChange = (size, value) => {
        setStock(prev => ({ ...prev, [size]: Number(value) }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!product.name || !product.price || !product.imageUrl) {
            toast.error('Please fill in Name, Price, and Main Image URL.');
            return;
        }

        setSubmitting(true);
        const loadingToast = toast.loading('Uploading product...');

        try {
            const stockData = isSizeBased ? stock : parseInt(numericStock, 10) || 0;
            const productData = {
                ...product,
                price: parseFloat(product.price),
                discountPrice: product.discountPrice ? parseFloat(product.discountPrice) : null,
                tags: product.tags.split(',').map(tag => tag.trim()),
                stock: stockData,
                images: [product.imageUrl, ...product.images.filter(img => img !== '')],
                createdAt: new Date(),
                viewCount: 0,
                salesCount: 0,
            };

            await addDoc(collection(db, 'products'), productData);
            toast.dismiss(loadingToast);
            toast.success('Product successfully added!');
            // Reset form
            setProduct({ name: '', description: '', price: '', discountPrice: '', category: '', tags: '', sku: '', imageUrl: '', images: ['', '', ''], videoUrl: '' });
            setStock({});
            setNumericStock('');

        } catch (error) { 
            toast.dismiss(loadingToast);
            toast.error('Something went wrong. Please try again.');
            console.error("Error adding product: ", error);
        } finally {
            setSubmitting(false);
        }
    };

    const InputField = ({ icon, name, placeholder, value, onChange, type = "text" }) => (
        <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">{icon}</div>
            <input type={type} name={name} placeholder={placeholder} value={value} onChange={onChange}
                className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-lg shadow-sm focus:ring-2 focus:ring-black/50 transition-all text-sm tracking-wide font-medium" />
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-10">
            <div className="max-w-4xl mx-auto">
                <header className="text-center mb-12"><h1 className="text-3xl font-black uppercase tracking-tighter italic">Add New Creation</h1><p className="text-sm text-gray-400 font-bold tracking-widest mt-1">Expand the Zaqeen Universe</p></header>
                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Core Details */}
                    <div className="p-8 bg-white border border-gray-100 rounded-lg shadow-lg shadow-black/[0.02]">
                        <h2 className="text-lg font-bold tracking-tight mb-6 flex items-center gap-3"><HiOutlineSparkles/>Core Details</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2"><InputField icon={<HiOutlineCollection/>} name="name" placeholder="Product Name" value={product.name} onChange={handleChange} /></div>
                            <InputField icon={<HiOutlineCurrencyDollar/>} name="price" placeholder="Original Price (BDT)" value={product.price} onChange={handleChange} type="number" />
                            <InputField icon={<HiOutlineTag/>} name="discountPrice" placeholder="Discount Price (Optional)" value={product.discountPrice} onChange={handleChange} type="number" />
                            <InputField icon={<HiOutlineTag/>} name="category" placeholder="Category" value={product.category} onChange={handleChange} />
                            <div className="md:col-span-2"><InputField icon={<HiOutlineTag/>} name="tags" placeholder="Tags (comma-separated)" value={product.tags} onChange={handleChange} /></div>
                            <InputField icon={<HiOutlineBackspace/>} name="sku" placeholder="SKU" value={product.sku} onChange={handleChange} />
                             <div className="md:col-span-2">
                                <div className="relative">
                                    <textarea name="description" placeholder="Product Description..." value={product.description} onChange={handleChange} rows="4" className="w-full px-4 py-4 bg-white border border-gray-100 rounded-lg shadow-sm focus:ring-2 focus:ring-black/50 transition-all text-sm tracking-wide font-medium"></textarea>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stock Management */}
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
                                {Object.keys(stock).map(size => (
                                    <div key={size} className="flex items-center gap-4 p-2 rounded-lg bg-gray-50/50">
                                        <span className="font-bold w-20 text-center">{size}</span>
                                        <input type="number" value={stock[size]} onChange={(e) => handleStockChange(size, e.target.value)} placeholder="Quantity" className="w-full input" />
                                        <button type="button" onClick={() => handleRemoveSize(size)} className="p-2 text-rose-500 hover:bg-rose-100 rounded-full"><HiOutlineTrash/></button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <InputField icon={<HiOutlineCollection/>} name="numericStock" placeholder="Total Stock Quantity" value={numericStock} onChange={(e) => setNumericStock(e.target.value)} type="number" />
                        )}
                    </div>

                    {/* Media */}
                    <div className="p-8 bg-white border border-gray-100 rounded-lg shadow-lg shadow-black/[0.02]">
                        <h2 className="text-lg font-bold tracking-tight mb-6 flex items-center gap-3"><HiOutlinePhotograph/>Product Media</h2>
                        <div className="space-y-4">
                            <InputField icon={<HiOutlinePhotograph/>} name="imageUrl" placeholder="Main Image URL *" value={product.imageUrl} onChange={handleChange} />
                            {product.images.map((img, index) => (<InputField key={index} icon={<HiOutlinePhotograph/>} placeholder={`Additional Image URL ${index + 1}`} value={img} onChange={(e) => handleImageChange(index, e.target.value)} />))}
                            <InputField icon={<HiOutlineVideoCamera/>} name="videoUrl" placeholder="YouTube/Vimeo Video URL (Optional)" value={product.videoUrl} onChange={handleChange} />
                        </div>
                    </div>

                    <div className="flex justify-end pt-6"><button type="submit" disabled={submitting} className="group relative flex items-center justify-center gap-3 w-full md:w-auto bg-black text-white px-12 py-5 text-sm font-bold uppercase tracking-widest rounded-lg shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-black/30 disabled:opacity-50 transition-all"><span className="relative z-10">{submitting ? 'Publishing...' : 'Publish Product'}</span><HiOutlineUpload className="relative z-10 w-5 h-5 group-hover:animate-pulse"/></button></div>
                </form>
            </div>
        </div>
    );
};

export default AddProductPage;
