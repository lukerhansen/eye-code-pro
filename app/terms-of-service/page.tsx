export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms of Service</h1>
            
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600 mb-6">
                Last updated: {new Date().toLocaleDateString()}
              </p>

              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700 mb-4">
                By accessing and using this service, you accept and agree to be bound by the terms and provision of this agreement.
              </p>

              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">2. Use License</h2>
              <p className="text-gray-700 mb-4">
                Permission is granted to temporarily download one copy of the materials for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title.
              </p>

              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">3. Disclaimer</h2>
              <p className="text-gray-700 mb-4">
                The materials on this service are provided on an 'as is' basis. We make no warranties, expressed or implied, and hereby disclaim and negate all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
              </p>

              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">4. Limitations</h2>
              <p className="text-gray-700 mb-4">
                In no event shall our company or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on this service.
              </p>

              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">5. Privacy Policy</h2>
              <p className="text-gray-700 mb-4">
                Your use of our service is also governed by our Privacy Policy. Please review our Privacy Policy, which also governs the Site and informs users of our data collection practices.
              </p>

              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">6. Medical Disclaimer</h2>
              <p className="text-gray-700 mb-4">
                This service provides tools for medical billing and coding purposes. The information provided should not be used as a substitute for professional medical advice, diagnosis, or treatment. Always consult with qualified healthcare professionals regarding medical decisions.
              </p>

              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">7. Modifications</h2>
              <p className="text-gray-700 mb-4">
                We may revise these terms of service at any time without notice. By using this service, you are agreeing to be bound by the then current version of these terms of service.
              </p>

              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">8. Contact Information</h2>
              <p className="text-gray-700 mb-4">
                If you have any questions about these Terms of Service, please contact us at support@example.com.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}