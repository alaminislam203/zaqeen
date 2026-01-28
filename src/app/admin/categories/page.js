'use client';
import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import toast from 'react-hot-toast';
import { HiOutlineTag, HiOutlineTrash, HiOutlinePencil, HiOutlineCheck } from 'react-icons/hi';

export default function CategoriesPage() {
    const [categories, setCategories] = useState([]);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [editingCategory, setEditingCategory] = useState({ id: null, name: '' });
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const q = query(collection(db, 'categories'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const cats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setCategories(cats);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleCreateCategory = async (e) => {
        e.preventDefault();
        if (!newCategoryName.trim()) {
            toast.error('Category name cannot be empty.');
            return;
        }

        setIsSubmitting(true);
        try {
            // Check for duplicates
            const q = query(collection(db, 'categories'), where("name", "==", newCategoryName.trim()));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                toast.error('Category with this name already exists.');
                setIsSubmitting(false);
                return;
            }

            await addDoc(collection(db, 'categories'), {
                name: newCategoryName.trim(),
                createdAt: serverTimestamp(),
            });
            toast.success('Category created!');
            setNewCategoryName('');
        } catch (error) {
            toast.error('Failed to create category.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteCategory = async (id) => {
        if (window.confirm('Are you sure you want to delete this category?')) {
            try {
                await deleteDoc(doc(db, 'categories', id));
                toast.success('Category deleted.');
            } catch (error) {
                toast.error('Failed to delete category.');
            }
        }
    };

    const handleUpdateCategory = async () => {
        if (!editingCategory.id || !editingCategory.name.trim()) return;
        setIsSubmitting(true);
        try {
            const categoryRef = doc(db, 'categories', editingCategory.id);
            await updateDoc(categoryRef, { name: editingCategory.name.trim() });
            toast.success('Category updated!');
            setEditingCategory({ id: null, name: '' });
        } catch (error) {
            toast.error('Failed to update category.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return <div className="h-screen flex items-center justify-center bg-gray-50"><p className="text-sm font-bold">Loading Categories...</p></div>;
    }

    return (
        <div className="p-4 md:p-10 bg-gray-50 min-h-screen">
            <header className="mb-10">
                <h1 className="text-2xl font-black uppercase tracking-tighter italic">Category Management</h1>
                <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Organize your products</p>
            </header>

            <div className="max-w-4xl mx-auto">
                {/* Create Category Form */}
                <div className="bg-white border border-gray-100 rounded-lg shadow-sm mb-10">
                    <div className="px-8 py-5 border-b border-gray-100 flex items-center gap-4">
                        <HiOutlineTag size={20} className="text-gray-600"/>
                        <h3 className="text-sm font-black uppercase tracking-widest text-gray-700">Create New Category</h3>
                    </div>
                    <form onSubmit={handleCreateCategory} className="p-8 flex items-center gap-4">
                        <input 
                            type="text"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            placeholder="e.g., Clothing, Accessories..."
                            className="flex-grow bg-gray-50 border-2 border-gray-100 p-4 rounded-md text-sm font-bold tracking-wider focus:bg-white focus:border-black outline-none transition"
                        />
                        <button type="submit" disabled={isSubmitting} className="bg-black text-white px-8 py-4 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition disabled:bg-gray-300">
                            {isSubmitting && !editingCategory.id ? 'Creating...' : 'Create'}
                        </button>
                    </form>
                </div>

                {/* Categories List */}
                <div className="bg-white border border-gray-100 rounded-lg shadow-sm">
                     <div className="px-8 py-5 border-b border-gray-100">
                         <h3 className="text-sm font-black uppercase tracking-widest text-gray-700">Existing Categories ({categories.length})</h3>
                    </div>
                    <div className="p-4">
                        {categories.map(category => (
                            <div key={category.id} className="flex items-center justify-between p-4 rounded-lg hover:bg-gray-50">
                                {editingCategory.id === category.id ? (
                                    <input 
                                        type="text" 
                                        value={editingCategory.name}
                                        onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                                        className="bg-white border-b-2 border-black py-1 text-sm font-bold tracking-wider outline-none"
                                    />
                                ) : (
                                    <p className="text-sm font-bold tracking-wider text-gray-800">{category.name}</p>
                                )}
                                <div className="flex items-center gap-4">
                                    {editingCategory.id === category.id ? (
                                        <button onClick={handleUpdateCategory} disabled={isSubmitting} className="p-2 text-emerald-600 hover:bg-emerald-100 rounded-full transition">
                                            <HiOutlineCheck size={18}/>
                                        </button>
                                    ) : (
                                        <button onClick={() => setEditingCategory({ id: category.id, name: category.name })} className="p-2 text-gray-500 hover:bg-gray-200 rounded-full transition">
                                            <HiOutlinePencil size={18}/>
                                        </button>
                                    )}
                                    <button onClick={() => handleDeleteCategory(category.id)} className="p-2 text-rose-500 hover:bg-rose-100 rounded-full transition">
                                        <HiOutlineTrash size={18}/>
                                    </button>
                                </div>
                            </div>
                        ))}
                        {categories.length === 0 && <p className="text-center text-sm text-gray-400 p-10">No categories found. Add one to get started.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}
