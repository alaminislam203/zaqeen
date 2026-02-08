'use client';
import React, { useState } from 'react';
import Papa from 'papaparse';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';

export default function BulkProductUpload() {
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState([]);
    const [validationErrors, setValidationErrors] = useState([]);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [fileName, setFileName] = useState('');

    const validateProduct = (product, index) => {
        const errors = [];
        
        if (!product.name || product.name.trim() === '') {
            errors.push(`Row ${index + 2}: Name is required`);
        }
        
        if (!product.price || isNaN(Number(product.price)) || Number(product.price) <= 0) {
            errors.push(`Row ${index + 2}: Valid price is required`);
        }
        
        if (product.discountPrice && Number(product.discountPrice) >= Number(product.price)) {
            errors.push(`Row ${index + 2}: Discount price must be less than regular price`);
        }

        return errors;
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setFileName(file.name);
        setValidationErrors([]);

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                // Validate all products
                let allErrors = [];
                const validData = results.data.filter((item, index) => {
                    const itemErrors = validateProduct(item, index);
                    allErrors = [...allErrors, ...itemErrors];
                    return item.name && item.price;
                });

                setPreview(validData);
                setValidationErrors(allErrors);

                if (allErrors.length > 0) {
                    toast.error(`Found ${allErrors.length} validation error(s)`, {
                        style: { borderRadius: '0px', background: '#ef4444', color: '#fff' }
                    });
                } else if (validData.length > 0) {
                    toast.success(`${validData.length} products validated successfully`, {
                        style: { borderRadius: '0px', background: '#10b981', color: '#fff' }
                    });
                }
            },
            error: (error) => {
                toast.error("Failed to parse CSV file", {
                    style: { borderRadius: '0px', background: '#ef4444', color: '#fff' }
                });
                console.error('CSV Parse Error:', error);
            }
        });
    };

    const handleBulkUpload = async () => {
        if (preview.length === 0) {
            toast.error('No products to upload');
            return;
        }

        if (validationErrors.length > 0) {
            toast.error('Please fix validation errors before uploading');
            return;
        }

        setUploading(true);
        setUploadProgress(0);
        const bulkToast = toast.loading("Uploading products...");

        try {
            const productRef = collection(db, 'products');
            const totalProducts = preview.length;
            let uploadedCount = 0;

            // Upload products in batches of 10
            const batchSize = 10;
            for (let i = 0; i < preview.length; i += batchSize) {
                const batch = preview.slice(i, i + batchSize);
                
                const uploadPromises = batch.map(product => {
                    // Process images
                    const extraImages = product.images 
                        ? product.images.split(';').map(url => url.trim()).filter(url => url)
                        : [];

                    // Process stock
                    let stockData = {};
                    if (product.stock && typeof product.stock === 'string' && product.stock.includes(':')) {
                        product.stock.split(';').forEach(pair => {
                            const [size, qty] = pair.split(':');
                            if (size && qty) {
                                stockData[size.trim().toUpperCase()] = Number(qty.trim()) || 0;
                            }
                        });
                    } else {
                        stockData = Number(product.stock) || 0;
                    }

                    // Process tags
                    const tags = product.tags 
                        ? product.tags.split(';').map(tag => tag.trim()).filter(tag => tag)
                        : [];

                    const finalProduct = {
                        name: product.name.trim(),
                        title: product.title?.trim() || product.name.trim(),
                        price: Number(product.price),
                        discountPrice: product.discountPrice ? Number(product.discountPrice) : null,
                        category: product.category?.trim() || "Uncategorized",
                        description: product.description?.trim() || "",
                        sku: product.sku?.trim() || "",
                        imageUrl: extraImages[0] || "",
                        images: extraImages,              
                        videoUrl: product.videoUrl?.trim() || "", 
                        stock: stockData,
                        tags: tags,
                        status: 'published',
                        featured: product.featured?.toLowerCase() === 'true',
                        createdAt: serverTimestamp(),
                        salesCount: 0,
                        viewCount: 0
                    };

                    return addDoc(productRef, finalProduct);
                });

                await Promise.all(uploadPromises);
                uploadedCount += batch.length;
                setUploadProgress(Math.round((uploadedCount / totalProducts) * 100));
            }

            toast.success(`${totalProducts} products uploaded successfully!`, { 
                id: bulkToast,
                style: { borderRadius: '0px', background: '#10b981', color: '#fff' }
            });
            
            // Reset
            setPreview([]);
            setFileName('');
            setValidationErrors([]);
            setUploadProgress(0);
            
            if (document.getElementById('csvInput')) {
                document.getElementById('csvInput').value = '';
            }
        } catch (error) {
            toast.error("Upload failed. Please try again.", { 
                id: bulkToast,
                style: { borderRadius: '0px', background: '#ef4444', color: '#fff' }
            });
            console.error("Firebase Error:", error);
        } finally {
            setUploading(false);
        }
    };

    const downloadTemplate = () => {
        const template = `name,price,discountPrice,category,description,sku,images,videoUrl,stock,tags,featured
Premium T-Shirt,1500,1200,Clothing,High quality cotton t-shirt,SKU001,https://example.com/img1.jpg;https://example.com/img2.jpg,https://youtube.com/video,M:20;L:15;XL:10,cotton;premium;summer,true
Classic Jeans,2500,,Clothing,Comfortable denim jeans,SKU002,https://example.com/img3.jpg,,30,denim;casual,false`;

        const blob = new Blob([template], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'product_upload_template.csv';
        a.click();
        window.URL.revokeObjectURL(url);
        
        toast.success('Template downloaded successfully', {
            style: { borderRadius: '0px', background: '#000', color: '#fff', fontSize: '10px' }
        });
    };

    const clearPreview = () => {
        setPreview([]);
        setValidationErrors([]);
        setFileName('');
        setUploadProgress(0);
        if (document.getElementById('csvInput')) {
            document.getElementById('csvInput').value = '';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-4 md:p-8 lg:p-12 selection:bg-black selection:text-white">
            <div className="max-w-7xl mx-auto">
                
                {/* Header */}
                <header className="mb-12">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-8">
                        <div className="space-y-2">
                            <span className="text-[10px] font-black uppercase tracking-[0.6em] text-gray-400 block">Mass Import System</span>
                            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black uppercase tracking-tighter">Bulk Upload</h1>
                        </div>
                        
                        <button
                            onClick={downloadTemplate}
                            className="px-6 py-3 bg-white border-2 border-black text-black text-[10px] font-black uppercase tracking-wide hover:bg-black hover:text-white transition-all flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                            </svg>
                            Download Template
                        </button>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white border border-gray-200 p-6">
                            <p className="text-[9px] font-black uppercase tracking-wider text-gray-400 mb-2">Ready to Upload</p>
                            <p className="text-3xl font-black text-green-600">{preview.length}</p>
                        </div>
                        <div className="bg-white border border-gray-200 p-6">
                            <p className="text-[9px] font-black uppercase tracking-wider text-gray-400 mb-2">Validation Errors</p>
                            <p className="text-3xl font-black text-red-600">{validationErrors.length}</p>
                        </div>
                        <div className="bg-white border border-gray-200 p-6">
                            <p className="text-[9px] font-black uppercase tracking-wider text-gray-400 mb-2">Upload Progress</p>
                            <p className="text-3xl font-black text-blue-600">{uploadProgress}%</p>
                        </div>
                    </div>
                </header>

                <div className="grid lg:grid-cols-2 gap-8">
                    
                    {/* Left Column - Upload Area */}
                    <div className="space-y-6">
                        
                        {/* Upload Zone */}
                        <div className="bg-white border border-gray-200 p-8 shadow-lg">
                            <h3 className="text-[11px] font-black uppercase tracking-wide mb-6">Upload CSV File</h3>
                            
                            <div className="relative group cursor-pointer border-2 border-dashed border-gray-300 hover:border-black transition-all p-16 text-center bg-gray-50">
                                <input 
                                    id="csvInput"
                                    type="file" 
                                    accept=".csv" 
                                    onChange={handleFileChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                                />
                                <div className="space-y-4">
                                    <svg className="w-16 h-16 mx-auto text-gray-300 group-hover:text-black transition-colors" fill="none" strokeWidth="1.5" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                                    </svg>
                                    <div>
                                        <p className="text-[11px] font-black uppercase tracking-wide mb-2">
                                            {fileName || 'Drop CSV file here or click to browse'}
                                        </p>
                                        <p className="text-[9px] text-gray-500">Supports .csv files up to 10MB</p>
                                    </div>
                                </div>
                            </div>

                            {fileName && (
                                <div className="mt-4 p-4 bg-green-50 border border-green-200 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        <span className="text-[10px] font-bold text-green-700">{fileName}</span>
                                    </div>
                                    <button
                                        onClick={clearPreview}
                                        className="text-green-700 hover:text-green-900"
                                    >
                                        <svg className="w-5 h-5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* CSV Format Guide */}
                        <div className="bg-white border border-gray-200 p-8 shadow-lg">
                            <h3 className="text-[11px] font-black uppercase tracking-wide mb-6 flex items-center gap-2">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                                CSV Format Guide
                            </h3>
                            
                            <div className="space-y-4 text-[10px]">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="font-black uppercase tracking-wide text-gray-600 mb-2">Required Fields:</p>
                                        <ul className="space-y-1 text-gray-600">
                                            <li className="flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                                                name
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                                                price
                                            </li>
                                        </ul>
                                    </div>
                                    
                                    <div>
                                        <p className="font-black uppercase tracking-wide text-gray-600 mb-2">Optional Fields:</p>
                                        <ul className="space-y-1 text-gray-600">
                                            <li className="flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 bg-gray-300 rounded-full"></span>
                                                discountPrice
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 bg-gray-300 rounded-full"></span>
                                                category
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 bg-gray-300 rounded-full"></span>
                                                description
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 bg-gray-300 rounded-full"></span>
                                                sku
                                            </li>
                                        </ul>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-gray-100">
                                    <p className="font-black uppercase tracking-wide text-gray-600 mb-3">Special Formats:</p>
                                    <div className="space-y-2 bg-gray-50 p-4">
                                        <div>
                                            <p className="font-bold text-gray-700 mb-1">Images (Multiple):</p>
                                            <code className="text-[9px] text-blue-600">url1;url2;url3</code>
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-700 mb-1">Stock (Size-based):</p>
                                            <code className="text-[9px] text-blue-600">M:20;L:15;XL:10</code>
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-700 mb-1">Tags:</p>
                                            <code className="text-[9px] text-blue-600">tag1;tag2;tag3</code>
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-700 mb-1">Featured:</p>
                                            <code className="text-[9px] text-blue-600">true or false</code>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Validation Errors */}
                        {validationErrors.length > 0 && (
                            <div className="bg-red-50 border border-red-200 p-6 shadow-lg">
                                <h3 className="text-[11px] font-black uppercase tracking-wide text-red-700 mb-4 flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                    Validation Errors ({validationErrors.length})
                                </h3>
                                <div className="max-h-60 overflow-y-auto space-y-2">
                                    {validationErrors.map((error, index) => (
                                        <p key={index} className="text-[9px] text-red-600 font-bold">
                                            • {error}
                                        </p>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column - Preview */}
                    <div className="space-y-6">
                        <div className="bg-white border border-gray-200 shadow-lg">
                            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                                <h3 className="text-[11px] font-black uppercase tracking-wide">
                                    Preview ({preview.length} Products)
                                </h3>
                                {preview.length > 0 && (
                                    <button
                                        onClick={clearPreview}
                                        className="text-[9px] font-black uppercase tracking-wide text-red-500 hover:text-red-700"
                                    >
                                        Clear All
                                    </button>
                                )}
                            </div>

                            <div className="max-h-[600px] overflow-y-auto">
                                {preview.length > 0 ? (
                                    <table className="w-full text-left border-collapse">
                                        <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
                                            <tr className="text-[9px] uppercase tracking-wide font-black text-gray-600">
                                                <th className="p-4">Name</th>
                                                <th className="p-4 text-center">Price</th>
                                                <th className="p-4 text-center">Category</th>
                                                <th className="p-4 text-center">Stock</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {preview.map((p, i) => (
                                                <tr key={i} className="text-[10px] hover:bg-gray-50 transition-colors">
                                                    <td className="p-4">
                                                        <p className="font-bold truncate max-w-[200px]">{p.name}</p>
                                                        {p.sku && (
                                                            <p className="text-[9px] text-gray-500 mt-1">SKU: {p.sku}</p>
                                                        )}
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <p className="font-black">৳{Number(p.price).toLocaleString()}</p>
                                                        {p.discountPrice && (
                                                            <p className="text-[9px] text-gray-400 line-through">
                                                                ৳{Number(p.discountPrice).toLocaleString()}
                                                            </p>
                                                        )}
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <span className="inline-block px-2 py-1 bg-gray-100 text-[9px] font-bold uppercase">
                                                            {p.category || 'N/A'}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-center font-bold">
                                                        {typeof p.stock === 'object' 
                                                            ? Object.entries(p.stock).map(([size, qty]) => `${size}:${qty}`).join(', ')
                                                            : p.stock || 0
                                                        }
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-32 text-gray-300">
                                        <svg className="w-24 h-24 mb-4" fill="none" strokeWidth="1.5" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                        </svg>
                                        <p className="text-[11px] font-black uppercase tracking-wide">No Products to Preview</p>
                                        <p className="text-[9px] mt-2">Upload a CSV file to see preview</p>
                                    </div>
                                )}
                            </div>

                            {/* Upload Progress */}
                            {uploading && (
                                <div className="p-6 border-t border-gray-200 bg-gray-50">
                                    <div className="space-y-3">
                                        <div className="flex justify-between text-[10px] font-bold">
                                            <span>Uploading products...</span>
                                            <span>{uploadProgress}%</span>
                                        </div>
                                        <div className="w-full h-2 bg-gray-200 overflow-hidden">
                                            <div 
                                                className="h-full bg-gradient-to-r from-black to-neutral-800 transition-all duration-500"
                                                style={{ width: `${uploadProgress}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Upload Button */}
                            {preview.length > 0 && validationErrors.length === 0 && (
                                <div className="p-6 border-t border-gray-200">
                                    <button 
                                        onClick={handleBulkUpload}
                                        disabled={uploading}
                                        className="group relative w-full bg-black text-white py-5 text-[11px] font-black uppercase tracking-wider overflow-hidden transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                                    >
                                        <span className="relative z-10 flex items-center justify-center gap-3">
                                            {uploading ? (
                                                <>
                                                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Uploading... {uploadProgress}%
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="w-5 h-5" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                                                    </svg>
                                                    Upload {preview.length} Products
                                                </>
                                            )}
                                        </span>
                                        <div className="absolute inset-0 bg-gradient-to-r from-neutral-800 to-neutral-900 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}