'use client';
import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import toast from 'react-hot-toast';
import { HiOutlineCog, HiOutlineTruck, HiOutlineMail, HiOutlineExclamationCircle, HiOutlineGlobeAlt, HiOutlinePhotograph } from 'react-icons/hi';

// Reusable Card component
const SettingsCard = ({ title, icon, children }) => (
    <div className="bg-white border border-gray-100 rounded-lg shadow-sm">
        <div className="px-8 py-5 border-b border-gray-100 flex items-center gap-4">
            {icon}
            <h3 className="text-sm font-black uppercase tracking-widest text-gray-700">{title}</h3>
        </div>
        <div className="p-8 space-y-6">
            {children}
        </div>
    </div>
);

// Reusable Input component
const InputField = ({ label, name, type = 'text', value, onChange, placeholder, icon }) => (
    <div>
        <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
            {icon} {label}
        </label>
        <input 
            type={type} 
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className="w-full bg-gray-50 border-2 border-gray-100 p-4 rounded-md text-sm font-bold tracking-wider focus:bg-white focus:border-black outline-none transition"
        />
    </div>
);

export default function SettingsPage() {
    const [settings, setSettings] = useState({
        maintenanceMode: false,
        shippingFee: 60,
        outsideShippingFee: 120,
        contactEmail: '',
        contactAddress: '',
        bannerHeadline: '',
        bannerSubheading: '',
        bannerImageUrl: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            const docRef = doc(db, 'settings', 'site_config');
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setSettings(prev => ({...prev, ...docSnap.data()}));
            }
            setLoading(false);
        };
        fetchSettings();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const docRef = doc(db, 'settings', 'site_config');
            // Ensure fees are numbers
            const dataToSave = {
                ...settings,
                shippingFee: Number(settings.shippingFee),
                outsideShippingFee: Number(settings.outsideShippingFee)
            };
            await setDoc(docRef, dataToSave, { merge: true });
            toast.success('Settings updated successfully!');
        } catch (error) {
            toast.error('Failed to update settings.');
            console.error("Error saving settings: ", error);
        }
        setSaving(false);
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setSettings(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    if (loading) {
        return <div className="h-screen flex items-center justify-center bg-gray-50"><p className="text-sm font-bold">Loading Settings...</p></div>;
    }

    return (
        <div className="p-4 md:p-10 bg-gray-50 min-h-screen">
            <header className="mb-10">
                 <h1 className="text-2xl font-black uppercase tracking-tighter italic">Site Settings</h1>
                 <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Manage global configurations</p>
            </header>

            <div className="max-w-4xl mx-auto space-y-10">
                 <SettingsCard title="Site Controls" icon={<HiOutlineCog size={20} />}>
                     <div className="flex items-center justify-between bg-blue-50 border border-blue-200 p-6 rounded-lg">
                        <div>
                           <h4 className="font-bold text-sm text-blue-800">Maintenance Mode</h4>
                           <p className="text-xs text-blue-600 mt-1">Temporarily take your site offline for updates.</p>
                         </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" name="maintenanceMode" checked={settings.maintenanceMode} onChange={handleInputChange} className="sr-only peer" />
                            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                 </SettingsCard>

                 <SettingsCard title="Promotion Banner" icon={<HiOutlinePhotograph size={20} />}>
                     <InputField label="Headline" name="bannerHeadline" value={settings.bannerHeadline} onChange={handleInputChange} placeholder="e.g., New Winter Collection"/>
                     <InputField label="Sub-heading" name="bannerSubheading" value={settings.bannerSubheading} onChange={handleInputChange} placeholder="e.g., Up to 30% off"/>
                     <InputField label="Background Image URL" name="bannerImageUrl" value={settings.bannerImageUrl} onChange={handleInputChange} placeholder="https://..."/>
                 </SettingsCard>

                 <SettingsCard title="Operational Settings" icon={<HiOutlineTruck size={20} />}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <InputField label="Dhaka Shipping Fee (৳)" name="shippingFee" type="number" value={settings.shippingFee} onChange={handleInputChange} placeholder="e.g., 60" icon={<HiOutlineGlobeAlt size={14}/>} />
                         <InputField label="Outside Dhaka Fee (৳)" name="outsideShippingFee" type="number" value={settings.outsideShippingFee} onChange={handleInputChange} placeholder="e.g., 120" icon={<HiOutlineGlobeAlt size={14}/>} />
                    </div>
                 </SettingsCard>
                 
                 <SettingsCard title="Contact Information" icon={<HiOutlineMail size={20} />}>
                     <InputField label="Public Email" name="contactEmail" type="email" value={settings.contactEmail} onChange={handleInputChange} placeholder="e.g., support@example.com" icon={<HiOutlineMail size={14}/>} />
                     <InputField label="Office Address" name="contactAddress" type="text" value={settings.contactAddress} onChange={handleInputChange} placeholder="e.g., House 1, Road 2, City" icon={<HiOutlineExclamationCircle size={14}/>} />
                 </SettingsCard>

                <div className="mt-10 flex justify-end">
                    <button 
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-black text-white px-10 py-4 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition disabled:bg-gray-300">
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
}
