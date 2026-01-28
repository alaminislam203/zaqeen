import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const URL = 'https://zaqeen.vercel.app';

export default async function sitemap() {
    // ১. স্ট্যাটিক পেজসমূহ (Priority এবং Change Frequency সহ)
    const staticRoutes = [
        '',
        '/shop',
        '/contact',
        '/about',
        '/return-policy',
        '/shipping-info',
        '/how-to-buy',
    ].map((route) => ({
        url: `${URL}${route}`,
        lastModified: new Date().toISOString(),
        changeFrequency: route === '' ? 'daily' : 'monthly',
        priority: route === '' ? 1.0 : 0.8,
    }));

    // ২. ডাইনামিক প্রোডাক্ট পেজসমূহ
    let productRoutes = [];
    try {
        const productsCollection = collection(db, 'products');
        const productsSnapshot = await getDocs(productsCollection);
        
        productRoutes = productsSnapshot.docs.map((doc) => {
            const data = doc.data();
            return {
                url: `${URL}/product/${doc.id}`,
                // যদি আপনার ফায়ারবেস ডকুমেন্টে 'updatedAt' ফিল্ড থাকে তবে সেটি ব্যবহার করা ভালো
                lastModified: data.updatedAt?.toDate 
                    ? data.updatedAt.toDate().toISOString() 
                    : new Date().toISOString(),
                changeFrequency: 'weekly',
                priority: 0.6,
            };
        });
    } catch (error) {
        console.error("Error fetching products for sitemap:", error);
    }

    return [...staticRoutes, ...productRoutes];
}
