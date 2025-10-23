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
            <h2 className="text-2xl font-bold text-gray-900 mb-4">For Patients</h2>
            <p className="text-gray-600 mb-6">
              Book appointments with verified doctors and pay securely
            </p>
            <div className="space-y-3">
              <button className="block w-full bg-gray-100 text-gray-500 text-center py-3 rounded-lg cursor-not-allowed">
                Coming Soon
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
