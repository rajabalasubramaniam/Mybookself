"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Breadcrumbs() {
    const pathname = usePathname();
    const pathSegments = pathname.split('/').filter(segment => segment);

    if (pathSegments.length === 0) return null;

    const breadcrumbs = pathSegments.map((segment, index) => {
        const href = '/' + pathSegments.slice(0, index + 1).join('/');
        const name = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
        return { href, name };
    });

    return (
        <nav className="bg-gray-100 py-2 px-4 text-sm">
            <div className="max-w-7xl mx-auto">
                <Link href="/" className="text-gray-600 hover:text-blue-900">Home</Link>
                {breadcrumbs.map((crumb, i) => (
                    <span key={crumb.href}>
                        <span className="mx-2 text-gray-400">/</span>
                        {i === breadcrumbs.length - 1 ? (
                            <span className="text-gray-800 font-medium">{crumb.name}</span>
                        ) : (
                            <Link href={crumb.href} className="text-gray-600 hover:text-blue-900">
                                {crumb.name}
                            </Link>
                        )}
                    </span>
                ))}
            </div>
        </nav>
    );
}