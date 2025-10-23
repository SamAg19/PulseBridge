import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Healthcare Platform
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Connect with verified doctors and manage appointments with PYUSD payments
          </p>
        </div>

        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">For Doctors</h2>
            <p className="text-gray-600 mb-6">
              Create tasks, manage appointments, and receive payments in PYUSD
            </p>
            <div className="space-y-3">
              <Link
                href="/auth/signin"
                className="block w-full bg-blue-600 text-white text-center py-3 rounded-lg hover:bg-blue-700 transition"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="block w-full bg-white text-blue-600 border-2 border-blue-600 text-center py-3 rounded-lg hover:bg-blue-50 transition"
              >
                Register as Doctor
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Features</h2>
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                Verified doctor profiles
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                Flexible appointment scheduling
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                Secure PYUSD payments on Solana
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                Payment approval workflow
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
