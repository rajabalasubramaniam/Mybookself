import Link from "next/link";

export default function PendingApproval() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center p-8 bg-white rounded-xl shadow max-w-md">
                <h2 className="text-2xl font-bold text-amber-600 mb-4">Account Pending Approval</h2>
                <p className="text-gray-600 mb-6">
                    Your email is verified, but your account is waiting for admin approval. 
                    Please check back later or contact the site administrator.
                </p>
                <Link href="/" className="text-blue-900 hover:underline">
                    Return to Home
                </Link>
            </div>
        </div>
    );
}