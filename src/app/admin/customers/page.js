'use client';
import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import toast from 'react-hot-toast';
import { HiOutlineUserGroup, HiOutlinePencilAlt, HiOutlineTrash, HiOutlineShieldCheck } from 'react-icons/hi';
import { format } from 'date-fns';

export default function CustomersPage() {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const usersData = snapshot.docs.map(doc => {
                const data = doc.data();
                let createdAtDate = null;
                // Check if createdAt exists and has a toDate method (i.e., is a Firestore Timestamp)
                if (data.createdAt && typeof data.createdAt.toDate === 'function') {
                    createdAtDate = data.createdAt.toDate();
                } else if (data.createdAt) {
                     // Fallback for other formats like ISO strings or numbers
                    const date = new Date(data.createdAt);
                    // Check if the parsed date is valid
                    if (!isNaN(date.getTime())) {
                        createdAtDate = date;
                    }
                }
                return {
                    id: doc.id,
                    ...data,
                    createdAt: createdAtDate
                };
            });
            setCustomers(usersData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching customers: ", error);
            toast.error("Failed to load customer data.");
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleRoleChange = async (id, currentRole) => {
        const newRole = currentRole === 'admin' ? 'customer' : 'admin';
        if (window.confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
            const userRef = doc(db, 'users', id);
            try {
                await updateDoc(userRef, { role: newRole });
                toast.success("User role updated successfully.");
            } catch (error) {
                toast.error("Failed to update user role.");
                console.error("Error updating role: ", error);
            }
        }
    };

    const handleDeleteUser = async (id) => {
        if (window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
            try {
                await deleteDoc(doc(db, 'users', id));
                toast.success("User deleted successfully.");
            } catch (error) {
                toast.error("Failed to delete user.");
                console.error("Error deleting user: ", error);
            }
        }
    };

    if (loading) {
        return <div className="p-10"><p>Loading customers...</p></div>;
    }

    return (
        <div className="p-4 md:p-10 bg-gray-50 min-h-screen">
            <header className="mb-10">
                <h1 className="text-2xl font-black uppercase tracking-tighter italic">Customers</h1>
                <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Manage all registered users</p>
            </header>

            <div className="bg-white border border-gray-100 rounded-lg shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50/50 border-b border-gray-100 text-[10px] uppercase tracking-widest text-gray-500">
                            <tr>
                                <th scope="col" className="px-6 py-4">Name</th>
                                <th scope="col" className="px-6 py-4">Email</th>
                                <th scope="col" className="px-6 py-4">Joined On</th>
                                <th scope="col" className="px-6 py-4">Role</th>
                                <th scope="col" className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {customers.map(customer => (
                                <tr key={customer.id} className="border-b border-gray-100 hover:bg-gray-50/50 text-gray-700">
                                    <td className="px-6 py-4 font-bold tracking-wider">{customer.displayName || 'N/A'}</td>
                                    <td className="px-6 py-4">{customer.email}</td>
                                    <td className="px-6 py-4">{customer.createdAt ? format(customer.createdAt, 'PP') : 'N/A'}</td>
                                    <td className="px-6 py-4">
                                        <button onClick={() => handleRoleChange(customer.id, customer.role)} className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${ 
                                            customer.role === 'admin' ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}>
                                            {customer.role || 'customer'}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => handleDeleteUser(customer.id)} className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition ml-2"><HiOutlineTrash size={18} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                 {customers.length === 0 && !loading && (
                    <div className="text-center p-20">
                        <HiOutlineUserGroup className="mx-auto text-gray-300" size={48} />
                        <p className="mt-4 text-sm text-gray-500">No customers found.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
