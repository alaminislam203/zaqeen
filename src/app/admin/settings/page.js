'use client';
import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import toast from 'react-hot-toast';

export default function SettingsPage() {
    const [settings, setSettings] = useState({
        maintenanceMode: false,
        shippingFee: 60,
        outsideShippingFee: 120,
        freeShippingThreshold: 2000,
        contactEmail: '',
        contactPhone: '',
        contactAddress: '',
        bannerHeadline: '',
        bannerSubheading: '',
        bannerImageUrl: '',
        bannerButtonText: '',
        bannerButtonLink: '',
        socialLinks: {
            facebook: '',
            instagram: '',
            twitter: '',
            youtube: ''
        },
        businessHours: '',
        currency: 'BDT',
        taxRate: 0,
        allowGuestCheckout: true,
        requireEmailVerification: false,
        maxOrderQuantity: 10,
        lowStockThreshold: 5,
        bkashNumber: '01761049936',
        nagadNumber: '01761049936',
        enableBkash: true,
        enableNagad: true,
        enableCod: true
    });
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('general');
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const docRef = doc(db, 'settings', 'site_config');
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setSettings(prev => ({...prev, ...docSnap.data()}));
                } else {
                    // Document doesn't exist, create with defaults
                    const defaultSettings = {
                        maintenanceMode: false,
                        shippingFee: 60,
                        outsideShippingFee: 120,
                        freeShippingThreshold: 2000,
                        contactEmail: '',
                        contactPhone: '',
                        contactAddress: '',
                        bannerHeadline: '',
                        bannerSubheading: '',
                        bannerImageUrl: '',
                        bannerButtonText: '',
                        bannerButtonLink: '',
                        socialLinks: {
                            facebook: '',
                            instagram: '',
                            twitter: '',
                            youtube: ''
                        },
                        businessHours: '',
                        currency: 'BDT',
                        taxRate: 0,
                        allowGuestCheckout: true,
                        requireEmailVerification: false,
                        maxOrderQuantity: 10,
                        lowStockThreshold: 5,
                        bkashNumber: '01761049936',
                        nagadNumber: '01761049936',
                        enableBkash: true,
                        enableNagad: true,
                        enableCod: true
                    };
                    await setDoc(docRef, defaultSettings);
                    setSettings(prev => ({...prev, ...defaultSettings}));
                }
            } catch (error) {
                toast.error('Failed to load settings');
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        const saveToast = toast.loading('Saving settings...');
        
        try {
            const docRef = doc(db, 'settings', 'site_config');
            const dataToSave = {
                ...settings,
                shippingFee: Number(settings.shippingFee),
                outsideShippingFee: Number(settings.outsideShippingFee),
                freeShippingThreshold: Number(settings.freeShippingThreshold),
                taxRate: Number(settings.taxRate),
                maxOrderQuantity: Number(settings.maxOrderQuantity),
                lowStockThreshold: Number(settings.lowStockThreshold),
                lastUpdated: serverTimestamp()
            };
            
            await setDoc(docRef, dataToSave, { merge: true });
            toast.success('Settings saved successfully!', { 
                id: saveToast,
                style: { borderRadius: '0px', background: '#10b981', color: '#fff' }
            });
            setHasChanges(false);
        } catch (error) {
            toast.error('Failed to save settings', { id: saveToast });
            console.error("Error saving settings:", error);
        } finally {
            setSaving(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setSettings(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        setHasChanges(true);
    };

    const handleToggleChange = async (e) => {
        const { name, checked } = e.target;
        const previousValue = settings[name];
        setSettings(prev => ({ ...prev, [name]: checked }));
        setHasChanges(true);

        // Auto-save for critical toggles
        if (['maintenanceMode', 'enableBkash', 'enableNagad', 'enableCod'].includes(name)) {
            try {
                const docRef = doc(db, 'settings', 'site_config');
                await setDoc(docRef, { [name]: checked }, { merge: true });
                toast.success(`${name.replace('enable', '').replace('Mode', ' Mode')} updated`, {
                    style: { borderRadius: '0px', background: '#10b981', color: '#fff' }
                });
            } catch (error) {
                // Revert the local state if save fails
                setSettings(prev => ({ ...prev, [name]: previousValue }));
                toast.error('Failed to update setting', { style: { borderRadius: '0px', background: '#ef4444', color: '#fff' } });
                console.error(error);
            }
        }
    };

    const handleSocialChange = (platform, value) => {
        setSettings(prev => ({
            ...prev,
            socialLinks: {
                ...prev.socialLinks,
                [platform]: value
            }
        }));
        setHasChanges(true);
    };

    const tabs = [
        { id: 'general', label: 'General', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
        { id: 'shipping', label: 'Shipping', icon: 'M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12' },
        { id: 'payment', label: 'Payment', icon: 'M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z' },
        { id: 'banner', label: 'Banner', icon: 'M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z' },
        { id: 'contact', label: 'Contact', icon: 'M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75' },
        { id: 'advanced', label: 'Advanced', icon: 'M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z' }
    ];

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-white">
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 border-2 border-gray-200 rounded-full"></div>
                    <div className="absolute inset-0 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                </div>
                <p className="mt-6 text-[9px] uppercase tracking-[0.4em] font-black text-gray-400">Loading Settings...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-4 md:p-8 lg:p-12 selection:bg-black selection:text-white">
            <div className="max-w-6xl mx-auto">
                
                {/* Header */}
                <header className="mb-10">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
                        <div className="space-y-2">
                            <span className="text-[10px] font-black uppercase tracking-[0.6em] text-gray-400 block">Configuration Panel</span>
                            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black uppercase tracking-tighter">Site Settings</h1>
                        </div>
                        
                        {hasChanges && (
                            <div className="flex items-center gap-3">
                                <span className="px-3 py-1 bg-amber-100 text-amber-700 text-[9px] font-black uppercase tracking-wide">
                                    Unsaved Changes
                                </span>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="px-8 py-4 bg-black text-white text-[10px] font-black uppercase tracking-wider hover:bg-neutral-800 transition-all disabled:opacity-50 shadow-lg flex items-center gap-2"
                                >
                                    {saving ? (
                                        <>
                                            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                            Save Changes
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </header>

                {/* Tabs */}
                <div className="mb-8 border-b border-gray-200">
                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-6 py-3 text-[10px] font-black uppercase tracking-wide whitespace-nowrap transition-all ${
                                    activeTab === tab.id
                                        ? 'bg-black text-white'
                                        : 'bg-white text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                <svg className="w-4 h-4" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
                                </svg>
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab Content */}
                <div className="space-y-6">
                    
                    {/* General Settings */}
                    {activeTab === 'general' && (
                        <div className="space-y-6 animate-fadeIn">
                            {/* Maintenance Mode */}
                            <div className="bg-white border border-gray-200 p-8 shadow-lg">
                                <h3 className="text-[11px] font-black uppercase tracking-wide mb-6">Site Status</h3>
                                
                                <div className={`flex items-center justify-between p-6 border-2 ${
                                    settings.maintenanceMode 
                                        ? 'bg-red-50 border-red-200' 
                                        : 'bg-green-50 border-green-200'
                                }`}>
                                    <div>
                                        <h4 className={`font-black text-sm uppercase tracking-wide mb-1 ${
                                            settings.maintenanceMode ? 'text-red-700' : 'text-green-700'
                                        }`}>
                                            Maintenance Mode
                                        </h4>
                                        <p className={`text-[9px] ${
                                            settings.maintenanceMode ? 'text-red-600' : 'text-green-600'
                                        }`}>
                                            {settings.maintenanceMode 
                                                ? 'Site is currently offline for maintenance'
                                                : 'Site is live and accessible to visitors'
                                            }
                                        </p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            name="maintenanceMode"
                                            checked={settings.maintenanceMode}
                                            onChange={handleToggleChange}
                                            className="sr-only peer"
                                        />
                                        <div className="w-14 h-7 bg-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-red-600"></div>
                                    </label>
                                </div>
                            </div>

                            {/* Store Configuration */}
                            <div className="bg-white border border-gray-200 p-8 shadow-lg">
                                <h3 className="text-[11px] font-black uppercase tracking-wide mb-6">Store Configuration</h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase tracking-wide text-gray-600">
                                            Currency
                                        </label>
                                        <select
                                            name="currency"
                                            value={settings.currency}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 bg-white border-2 border-gray-200 focus:border-black outline-none transition-all text-[10px] font-bold uppercase"
                                        >
                                            <option value="BDT">BDT (৳)</option>
                                            <option value="USD">USD ($)</option>
                                            <option value="EUR">EUR (€)</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase tracking-wide text-gray-600">
                                            Tax Rate (%)
                                        </label>
                                        <input
                                            type="number"
                                            name="taxRate"
                                            value={settings.taxRate}
                                            onChange={handleInputChange}
                                            placeholder="0"
                                            className="w-full px-4 py-3 bg-white border-2 border-gray-200 focus:border-black outline-none transition-all text-sm font-bold"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase tracking-wide text-gray-600">
                                            Max Order Quantity
                                        </label>
                                        <input
                                            type="number"
                                            name="maxOrderQuantity"
                                            value={settings.maxOrderQuantity}
                                            onChange={handleInputChange}
                                            placeholder="10"
                                            className="w-full px-4 py-3 bg-white border-2 border-gray-200 focus:border-black outline-none transition-all text-sm font-bold"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase tracking-wide text-gray-600">
                                            Low Stock Threshold
                                        </label>
                                        <input
                                            type="number"
                                            name="lowStockThreshold"
                                            value={settings.lowStockThreshold}
                                            onChange={handleInputChange}
                                            placeholder="5"
                                            className="w-full px-4 py-3 bg-white border-2 border-gray-200 focus:border-black outline-none transition-all text-sm font-bold"
                                        />
                                    </div>
                                </div>

                                <div className="mt-6 space-y-4">
                                    <label className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 cursor-pointer hover:bg-gray-100 transition-all">
                                        <input
                                            type="checkbox"
                                            name="allowGuestCheckout"
                                            checked={settings.allowGuestCheckout}
                                            onChange={handleInputChange}
                                            className="w-5 h-5 cursor-pointer"
                                        />
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-wide">Allow Guest Checkout</p>
                                            <p className="text-[9px] text-gray-500">Let customers checkout without creating an account</p>
                                        </div>
                                    </label>

                                    <label className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 cursor-pointer hover:bg-gray-100 transition-all">
                                        <input
                                            type="checkbox"
                                            name="requireEmailVerification"
                                            checked={settings.requireEmailVerification}
                                            onChange={handleInputChange}
                                            className="w-5 h-5 cursor-pointer"
                                        />
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-wide">Require Email Verification</p>
                                            <p className="text-[9px] text-gray-500">Users must verify email before placing orders</p>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Payment Settings */}
                    {activeTab === 'payment' && (
                        <div className="space-y-6 animate-fadeIn">
                            <div className="bg-white border border-gray-200 p-8 shadow-lg">
                                <h3 className="text-[11px] font-black uppercase tracking-wide mb-6">Payment Methods</h3>

                                <div className="space-y-6">
                                    {/* bKash Settings */}
                                    <div className="p-6 bg-pink-50 border border-pink-200 rounded-xl">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-pink-600 text-white rounded-lg flex items-center justify-center font-black text-lg">
                                                    bK
                                                </div>
                                                <div>
                                                    <h4 className="text-[10px] font-black uppercase tracking-wide text-pink-800">bKash Payment</h4>
                                                    <p className="text-[9px] text-pink-700">Mobile banking payment method</p>
                                                </div>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    name="enableBkash"
                                                    checked={settings.enableBkash}
                                                    onChange={handleToggleChange}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-14 h-7 bg-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-pink-600"></div>
                                            </label>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black uppercase tracking-wide text-pink-800">
                                                bKash Number
                                            </label>
                                            <input
                                                type="tel"
                                                name="bkashNumber"
                                                value={settings.bkashNumber}
                                                onChange={handleInputChange}
                                                placeholder="017XXXXXXXX"
                                                className="w-full px-4 py-3 bg-white border-2 border-pink-200 focus:border-pink-600 outline-none transition-all text-sm font-bold"
                                                disabled={!settings.enableBkash}
                                            />
                                        </div>
                                    </div>

                                    {/* Nagad Settings */}
                                    <div className="p-6 bg-orange-50 border border-orange-200 rounded-xl">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-orange-600 text-white rounded-lg flex items-center justify-center font-black text-lg">
                                                    N
                                                </div>
                                                <div>
                                                    <h4 className="text-[10px] font-black uppercase tracking-wide text-orange-800">Nagad Payment</h4>
                                                    <p className="text-[9px] text-orange-700">Digital wallet payment method</p>
                                                </div>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    name="enableNagad"
                                                    checked={settings.enableNagad}
                                                    onChange={handleToggleChange}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-14 h-7 bg-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-orange-600"></div>
                                            </label>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black uppercase tracking-wide text-orange-800">
                                                Nagad Number
                                            </label>
                                            <input
                                                type="tel"
                                                name="nagadNumber"
                                                value={settings.nagadNumber}
                                                onChange={handleInputChange}
                                                placeholder="017XXXXXXXX"
                                                className="w-full px-4 py-3 bg-white border-2 border-orange-200 focus:border-orange-600 outline-none transition-all text-sm font-bold"
                                                disabled={!settings.enableNagad}
                                            />
                                        </div>
                                    </div>

                                    {/* COD Settings */}
                                    <div className="p-6 bg-gray-50 border border-gray-200 rounded-xl">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gray-600 text-white rounded-lg flex items-center justify-center">
                                                    <svg className="w-6 h-6" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <h4 className="text-[10px] font-black uppercase tracking-wide text-gray-800">Cash on Delivery</h4>
                                                    <p className="text-[9px] text-gray-700">Pay when you receive your order</p>
                                                </div>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    name="enableCod"
                                                    checked={settings.enableCod}
                                                    onChange={handleToggleChange}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-14 h-7 bg-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gray-600"></div>
                                            </label>
                                        </div>

                                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                            <p className="text-[9px] text-blue-700 leading-relaxed">
                                                Cash on Delivery is available only for specific locations. Customers will pay the exact order amount upon delivery.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Shipping Settings */}
                    {activeTab === 'shipping' && (
                        <div className="space-y-6 animate-fadeIn">
                            <div className="bg-white border border-gray-200 p-8 shadow-lg">
                                <h3 className="text-[11px] font-black uppercase tracking-wide mb-6">Shipping Rates</h3>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase tracking-wide text-gray-600">
                                            Dhaka Shipping Fee (৳)
                                        </label>
                                        <input
                                            type="number"
                                            name="shippingFee"
                                            value={settings.shippingFee}
                                            onChange={handleInputChange}
                                            placeholder="60"
                                            className="w-full px-4 py-3 bg-white border-2 border-gray-200 focus:border-black outline-none transition-all text-lg font-black"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase tracking-wide text-gray-600">
                                            Outside Dhaka Fee (৳)
                                        </label>
                                        <input
                                            type="number"
                                            name="outsideShippingFee"
                                            value={settings.outsideShippingFee}
                                            onChange={handleInputChange}
                                            placeholder="120"
                                            className="w-full px-4 py-3 bg-white border-2 border-gray-200 focus:border-black outline-none transition-all text-lg font-black"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase tracking-wide text-gray-600">
                                            Free Shipping Above (৳)
                                        </label>
                                        <input
                                            type="number"
                                            name="freeShippingThreshold"
                                            value={settings.freeShippingThreshold}
                                            onChange={handleInputChange}
                                            placeholder="2000"
                                            className="w-full px-4 py-3 bg-white border-2 border-gray-200 focus:border-black outline-none transition-all text-lg font-black"
                                        />
                                    </div>
                                </div>

                                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 flex items-start gap-3">
                                    <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-wide text-blue-800 mb-1">Shipping Info</p>
                                        <p className="text-[9px] text-blue-700 leading-relaxed">
                                            Orders above ৳{settings.freeShippingThreshold} will automatically qualify for free shipping. Adjust rates based on your delivery partners.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Banner Settings */}
                    {activeTab === 'banner' && (
                        <div className="space-y-6 animate-fadeIn">
                            <div className="bg-white border border-gray-200 p-8 shadow-lg">
                                <h3 className="text-[11px] font-black uppercase tracking-wide mb-6">Promotion Banner</h3>
                                
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase tracking-wide text-gray-600">
                                            Banner Headline
                                        </label>
                                        <input
                                            type="text"
                                            name="bannerHeadline"
                                            value={settings.bannerHeadline}
                                            onChange={handleInputChange}
                                            placeholder="e.g., New Winter Collection"
                                            className="w-full px-4 py-3 bg-white border-2 border-gray-200 focus:border-black outline-none transition-all text-sm font-bold"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase tracking-wide text-gray-600">
                                            Banner Subheading
                                        </label>
                                        <input
                                            type="text"
                                            name="bannerSubheading"
                                            value={settings.bannerSubheading}
                                            onChange={handleInputChange}
                                            placeholder="e.g., Up to 30% off on selected items"
                                            className="w-full px-4 py-3 bg-white border-2 border-gray-200 focus:border-black outline-none transition-all text-sm font-bold"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase tracking-wide text-gray-600">
                                            Background Image URL
                                        </label>
                                        <input
                                            type="url"
                                            name="bannerImageUrl"
                                            value={settings.bannerImageUrl}
                                            onChange={handleInputChange}
                                            placeholder="https://example.com/banner.jpg"
                                            className="w-full px-4 py-3 bg-white border-2 border-gray-200 focus:border-black outline-none transition-all text-sm font-bold"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black uppercase tracking-wide text-gray-600">
                                                Button Text
                                            </label>
                                            <input
                                                type="text"
                                                name="bannerButtonText"
                                                value={settings.bannerButtonText}
                                                onChange={handleInputChange}
                                                placeholder="e.g., Shop Now"
                                                className="w-full px-4 py-3 bg-white border-2 border-gray-200 focus:border-black outline-none transition-all text-sm font-bold"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black uppercase tracking-wide text-gray-600">
                                                Button Link
                                            </label>
                                            <input
                                                type="text"
                                                name="bannerButtonLink"
                                                value={settings.bannerButtonLink}
                                                onChange={handleInputChange}
                                                placeholder="/shop"
                                                className="w-full px-4 py-3 bg-white border-2 border-gray-200 focus:border-black outline-none transition-all text-sm font-bold"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Banner Preview */}
                                {(settings.bannerHeadline || settings.bannerImageUrl) && (
                                    <div className="mt-8 p-6 bg-gray-50 border border-gray-200">
                                        <p className="text-[9px] font-black uppercase tracking-wide text-gray-600 mb-4">Preview</p>
                                        <div 
                                            className="relative h-48 flex items-center justify-center text-white p-8 bg-cover bg-center"
                                            style={{ backgroundImage: settings.bannerImageUrl ? `url(${settings.bannerImageUrl})` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                                        >
                                            <div className="absolute inset-0 bg-black/30"></div>
                                            <div className="relative text-center">
                                                {settings.bannerHeadline && (
                                                    <h2 className="text-2xl font-black uppercase tracking-tight mb-2">{settings.bannerHeadline}</h2>
                                                )}
                                                {settings.bannerSubheading && (
                                                    <p className="text-sm font-bold mb-4">{settings.bannerSubheading}</p>
                                                )}
                                                {settings.bannerButtonText && (
                                                    <button className="px-6 py-2 bg-white text-black text-[10px] font-black uppercase tracking-wide">
                                                        {settings.bannerButtonText}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Contact Settings */}
                    {activeTab === 'contact' && (
                        <div className="space-y-6 animate-fadeIn">
                            <div className="bg-white border border-gray-200 p-8 shadow-lg">
                                <h3 className="text-[11px] font-black uppercase tracking-wide mb-6">Contact Information</h3>
                                
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black uppercase tracking-wide text-gray-600">
                                                Contact Email
                                            </label>
                                            <input
                                                type="email"
                                                name="contactEmail"
                                                value={settings.contactEmail}
                                                onChange={handleInputChange}
                                                placeholder="support@example.com"
                                                className="w-full px-4 py-3 bg-white border-2 border-gray-200 focus:border-black outline-none transition-all text-sm font-bold"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black uppercase tracking-wide text-gray-600">
                                                Contact Phone
                                            </label>
                                            <input
                                                type="tel"
                                                name="contactPhone"
                                                value={settings.contactPhone}
                                                onChange={handleInputChange}
                                                placeholder="+880 1234-567890"
                                                className="w-full px-4 py-3 bg-white border-2 border-gray-200 focus:border-black outline-none transition-all text-sm font-bold"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase tracking-wide text-gray-600">
                                            Business Address
                                        </label>
                                        <textarea
                                            name="contactAddress"
                                            value={settings.contactAddress}
                                            onChange={handleInputChange}
                                            placeholder="House 1, Road 2, Block A, City, Country"
                                            rows="3"
                                            className="w-full px-4 py-3 bg-white border-2 border-gray-200 focus:border-black outline-none transition-all text-sm font-bold resize-none"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase tracking-wide text-gray-600">
                                            Business Hours
                                        </label>
                                        <input
                                            type="text"
                                            name="businessHours"
                                            value={settings.businessHours}
                                            onChange={handleInputChange}
                                            placeholder="e.g., Mon-Fri: 9AM-6PM, Sat: 10AM-4PM"
                                            className="w-full px-4 py-3 bg-white border-2 border-gray-200 focus:border-black outline-none transition-all text-sm font-bold"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Social Links */}
                            <div className="bg-white border border-gray-200 p-8 shadow-lg">
                                <h3 className="text-[11px] font-black uppercase tracking-wide mb-6">Social Media Links</h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {['facebook', 'instagram', 'twitter', 'youtube'].map(platform => (
                                        <div key={platform} className="space-y-2">
                                            <label className="text-[9px] font-black uppercase tracking-wide text-gray-600 flex items-center gap-2">
                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                                    {platform === 'facebook' && <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>}
                                                    {platform === 'instagram' && <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"/>}
                                                    {platform === 'twitter' && <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>}
                                                    {platform === 'youtube' && <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>}
                                                </svg>
                                                {platform.charAt(0).toUpperCase() + platform.slice(1)}
                                            </label>
                                            <input
                                                type="url"
                                                value={settings.socialLinks[platform]}
                                                onChange={(e) => handleSocialChange(platform, e.target.value)}
                                                placeholder={`https://${platform}.com/yourpage`}
                                                className="w-full px-4 py-3 bg-white border-2 border-gray-200 focus:border-black outline-none transition-all text-sm font-bold"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Advanced Settings */}
                    {activeTab === 'advanced' && (
                        <div className="space-y-6 animate-fadeIn">
                            <div className="bg-white border border-gray-200 p-8 shadow-lg">
                                <h3 className="text-[11px] font-black uppercase tracking-wide mb-6 text-red-600">⚠️ Advanced Settings</h3>
                                
                                <div className="p-6 bg-red-50 border-2 border-red-200 mb-6">
                                    <p className="text-[10px] font-bold text-red-700 leading-relaxed">
                                        These settings affect core functionality. Changes here can impact site performance and user experience. Proceed with caution.
                                    </p>
                                </div>

                                <div className="space-y-6">
                                    <div className="p-6 bg-gray-50 border border-gray-200">
                                        <h4 className="text-[10px] font-black uppercase tracking-wide mb-4">Database Configuration</h4>
                                        <p className="text-[9px] text-gray-600 mb-4">Firebase settings are managed through environment variables.</p>
                                        <code className="block p-3 bg-black text-green-400 text-[9px] font-mono">
                                            NEXT_PUBLIC_FIREBASE_API_KEY=***<br/>
                                            NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=***<br/>
                                            NEXT_PUBLIC_FIREBASE_PROJECT_ID=***
                                        </code>
                                    </div>

                                    <div className="p-6 bg-gray-50 border border-gray-200">
                                        <h4 className="text-[10px] font-black uppercase tracking-wide mb-4">Cache Management</h4>
                                        <p className="text-[9px] text-gray-600 mb-4">Clear application cache to force fresh data fetch.</p>
                                        <button 
                                            onClick={() => {
                                                localStorage.clear();
                                                toast.success('Cache cleared');
                                            }}
                                            className="px-6 py-3 bg-red-500 text-white text-[9px] font-black uppercase tracking-wide hover:bg-red-600 transition-all"
                                        >
                                            Clear Cache
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Save Button (Fixed Bottom) */}
                {hasChanges && (
                    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-2xl z-50">
                        <div className="max-w-6xl mx-auto flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                                <span className="text-[10px] font-bold uppercase tracking-wide text-gray-600">
                                    You have unsaved changes
                                </span>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        window.location.reload();
                                    }}
                                    className="px-6 py-3 bg-gray-200 text-gray-700 text-[10px] font-black uppercase tracking-wide hover:bg-gray-300 transition-all"
                                >
                                    Discard
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="px-8 py-3 bg-black text-white text-[10px] font-black uppercase tracking-wide hover:bg-neutral-800 transition-all disabled:opacity-50 flex items-center gap-2"
                                >
                                    {saving ? (
                                        <>
                                            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            Save Changes
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}