'use client';
import React, { useState } from 'react';
import Papa from 'papaparse';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { HiOutlineCloudUpload, HiOutlineDocumentText, HiOutlineInformationCircle } from 'react-icons/hi';
import toast from 'react-hot-toast';

export default function BulkProductUpload() {
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState([]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    // নাম এবং প্রাইস আছে এমন ডাটা ফিল্টার করা
                    const validData = results.data.filter(item => item.name && item.price);
                    setPreview(validData);
                    toast.success(`${validData.length} Articles Detected.`);
                },
                error: (error) => {
                    toast.error("Format Breach: Invalid CSV.");
                }
            });
        }
    };

    const handleBulkUpload = async () => {
        if (preview.length === 0) return;
        setUploading(true);
        const bulkToast = toast.loading("Executing Mass Upload Protocol...");

        try {
            const productRef = collection(db, 'products');
            
            const uploadPromises = preview.map(product => {
                // ১. ইমেজ স্ট্রিং থেকে অ্যারে তৈরি (সেমিকোলন ';' দিয়ে আলাদা করা)
                const extraImages = product.images 
                    ? product.images.split(';').map(url => url.trim()) 
                    : [];

                const finalProduct = {
                    name: product.name || "Unnamed Article",
                    price: Number(product.price) || 0,
                    discountPrice: product.discountPrice ? Number(product.discountPrice) : null,
                    category: product.category || "Uncategorized",
                    description: product.description || "",
                    imageUrl: product.imageUrl || "", // মেইন থাম্বনেইল
                    images: extraImages,              // অতিরিক্ত ইমেজের গ্যালারি
                    videoUrl: product.videoUrl || "", // ভিডিও লিঙ্ক
                    stock: product.stock ? Number(product.stock) : 0,
                    status: 'active',
                    createdAt: serverTimestamp(),
                    salesCount: 0
                };

                return addDoc(productRef, finalProduct);
            });

            await Promise.all(uploadPromises);
            toast.success("All Articles Archived.", { id: bulkToast });
            setPreview([]);
            if (document.getElementById('csvInput')) {
                document.getElementById('csvInput').value = '';
            }
        } catch (error) {
            toast.error("Transmission Interrupted.", { id: bulkToast });
            console.error("Firebase Error:", error);
        } finally {
            setUploading(false);
        }
    };

    return (
        <section className="bg-white border border-gray-50 p-10 rounded-sm shadow-[0_40px_100px_rgba(0,0,0,0.02)] mb-20">
            <header className="mb-12 border-l-4 border-black pl-6">
                <span className="text-[10px] uppercase tracking-[0.5em] text-gray-300 font-black italic block mb-2">Technical Operations</span>
                <h2 className="text-2xl font-black uppercase tracking-tighter italic">Bulk Acquisition Protocol</h2>
            </header>

            <div className="grid lg:grid-cols-2 gap-16 items-start">
                <div className="space-y-8">
                    <div className="relative group cursor-pointer border-2 border-dashed border-gray-100 hover:border-black transition-all p-16 text-center bg-[#fcfcfc]">
                        <input 
                            id="csvInput"
                            type="file" 
                            accept=".csv" 
                            onChange={handleFileChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                        />
                        <div className="space-y-4">
                            <HiOutlineCloudUpload size={40} className="mx-auto text-gray-200 group-hover:text-black transition-colors" />
                            <p className="text-[11px] font-black uppercase tracking-[0.3em]">Drop CSV Blueprint</p>
                        </div>
                    </div>

                    <div className="bg-gray-50 p-6 space-y-4">
                        <h4 className="text-[9px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                            <HiOutlineInformationCircle /> CSV Blueprint Guide
                        </h4>
                        <ul className="text-[10px] font-bold text-gray-400 space-y-2 uppercase italic">
                            <li>• name, price (Mandatory)</li>
                            <li>• imageUrl (Main Image)</li>
                            <li>• images (Extra images separated by ;)</li>
                            <li>• videoUrl (Single video link)</li>
                        </ul>
                    </div>
                </div>

                <div className="min-h-[300px] flex flex-col">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] mb-6 text-gray-400 italic">Queue Log ({preview.length} Items)</h3>
                    <div className="flex-grow border border-gray-50 bg-white overflow-y-auto max-h-[350px]">
                        {preview.length > 0 ? (
                            <table className="w-full text-left border-collapse">
                                <tbody className="divide-y divide-gray-50">
                                    {preview.map((p, i) => (
                                        <tr key={i} className="text-[10px] uppercase font-black tracking-widest text-gray-500 italic">
                                            <td className="p-4 text-black">{p.name}</td>
                                            <td className="p-4">৳{p.price}</td>
                                            <td className="p-4 opacity-50">{p.category}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full opacity-20 space-y-4 py-20">
                                <HiOutlineDocumentText size={48} />
                                <p className="text-[9px] font-black uppercase tracking-widest">No Data Staged</p>
                            </div>
                        )}
                    </div>

                    {preview.length > 0 && (
                        <button 
                            onClick={handleBulkUpload}
                            disabled={uploading}
                            className="mt-8 w-full bg-black text-white py-6 text-[11px] font-black uppercase tracking-[0.6em] shadow-2xl active:scale-95 disabled:opacity-30 transition-all italic"
                        >
                            {uploading ? 'TRANSMITTING...' : 'EXECUTE MASS UPLOAD'}
                        </button>
                    )}
                </div>
            </div>
        </section>
    );
}
