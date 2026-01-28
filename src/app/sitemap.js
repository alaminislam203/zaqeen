import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const URL = 'https://zaqeen.vercel.app';

export default async function sitemap() {
    // Static pages
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
    }));

    // Dynamic product pages
    let productRoutes = [];
    try {
        const productsCollection = collection(db, 'products');
        const productsSnapshot = await getDocs(productsCollection);
        productRoutes = productsSnapshot.docs.map((doc) => ({
            url: `${URL}/product/${doc.id}`,
            lastModified: new Date().toISOString(), // Or use a field from your document
        }));
    } catch (error) {
        console.error("Error fetching products for sitemap:", error);
    }

    return [...staticRoutes, ...productRoutes];
}
