import { Link } from 'react-router-dom';
import { Header } from '@/components/Header';

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <h1 className="text-4xl font-bold text-gray-900">404</h1>
        <p className="text-gray-500">Page not found.</p>
        <Link to="/" className="text-purple-600 hover:underline">Go home</Link>
      </div>
    </div>
  );
}
