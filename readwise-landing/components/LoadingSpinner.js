export default function LoadingSpinner({ message = "Loading..." }) {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-900 border-t-transparent"></div>
                <p className="mt-4 text-gray-600">{message}</p>
            </div>
        </div>
    );
}