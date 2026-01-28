'use client';
import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import Navbar from '@/components/Navbar';
import { HiOutlineMail, HiOutlineLocationMarker, HiOutlinePhone } from 'react-icons/hi';

export default function ContactPage() {
    const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [contactInfo, setContactInfo] = useState({ email: '', address: '' });

    useEffect(() => {
        const fetchContactInfo = async () => {
            const docRef = doc(db, 'settings', 'site_config');
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                setContactInfo({
                    email: data.contactEmail || 'support@zaqeen.com',
                    address: data.contactAddress || 'Dhaka, Bangladesh'
                });
            }
        };
        fetchContactInfo();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.email || !formData.subject || !formData.message) {
            toast.error('Please fill out all fields.');
            return;
        }
        setIsSubmitting(true);
        try {
            await addDoc(collection(db, 'contacts'), {
                ...formData,
                status: 'Pending',
                createdAt: serverTimestamp()
            });
            toast.success('Message sent successfully! We will get back to you soon.');
            setFormData({ name: '', email: '', subject: '', message: '' });
        } catch (error) {
            toast.error('Failed to send message.');
            console.error("Error sending message: ", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-white min-h-screen">
            
            <div className="max-w-7xl mx-auto px-6 py-20">
                <header className="text-center mb-16">
                    <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter italic">Get In Touch</h1>
                    <p className="text-sm text-gray-500 mt-4 max-w-2xl mx-auto tracking-wider uppercase">We&apos;d love to hear from you. Whether you have a question about our products, need assistance, or just want to talk, feel free to reach out.</p>
                </header>

                <div className="grid md:grid-cols-2 gap-16">
                    {/* Contact Form */}
                    <div className="bg-gray-50 p-8 md:p-12 rounded-lg border border-gray-100">
                        <h2 className="text-xl font-bold mb-8 tracking-wider">Send a Message</h2>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Your Name" className="w-full input" />
                            <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Your Email" className="w-full input" />
                            <input type="text" name="subject" value={formData.subject} onChange={handleChange} placeholder="Subject" className="w-full input" />
                            <textarea name="message" value={formData.message} onChange={handleChange} placeholder="Your Message" rows="6" className="w-full input"></textarea>
                            <button type="submit" disabled={isSubmitting} className="w-full bg-black text-white py-4 rounded-md font-bold uppercase tracking-widest hover:bg-gray-800 transition disabled:bg-gray-400">
                                {isSubmitting ? 'Sending...' : 'Submit'}
                            </button>
                        </form>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-10 pt-8">
                        <h2 className="text-xl font-bold mb-8 tracking-wider">Contact Information</h2>
                        <div className="flex items-start gap-6">
                            <HiOutlineMail className="w-8 h-8 text-gray-400 mt-1" />
                            <div>
                                <h3 className="font-bold tracking-widest uppercase text-gray-800">Email Us</h3>
                                <p className="text-gray-500 mt-1">{contactInfo.email}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-6">
                            <HiOutlineLocationMarker className="w-8 h-8 text-gray-400 mt-1" />
                            <div>
                                <h3 className="font-bold tracking-widest uppercase text-gray-800">Our Location</h3>
                                <p className="text-gray-500 mt-1">{contactInfo.address}</p>
                            </div>
                        </div>
                         <div className="flex items-start gap-6">
                            <HiOutlinePhone className="w-8 h-8 text-gray-400 mt-1" />
                            <div>
                                <h3 className="font-bold tracking-widest uppercase text-gray-800">Call Us</h3>
                                <p className="text-gray-500 mt-1">(Support details coming soon)</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
             <style jsx global>{`
                .input {
                    background-color: #ffffff;
                    border: 1px solid #e5e7eb;
                    padding: 1rem;
                    border-radius: 0.5rem;
                    font-size: 0.875rem;
                    font-weight: 500;
                    outline: none;
                    transition: border-color 0.2s;
                }
                .input:focus {
                    border-color: #000000;
                }
            `}</style>
        </div>
    );
}
