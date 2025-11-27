export default function PrivacyPolicyPage() {
  const today = new Date().toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <section className="max-w-3xl mx-auto px-6 py-12 space-y-8">
      <h1 className="text-2xl font-bold text-slate-900">Privacy Policy</h1>
      <p className="text-slate-700 leading-relaxed">Last updated: {today}</p>

      <div className="space-y-6 text-slate-700 leading-relaxed">
        <p className="text-slate-700 leading-relaxed">
          Revo Reflect (“we”, “our”, or “the app”) is committed to protecting your privacy.
          This Privacy Policy explains how we collect, use, store, and protect your information
          when you use the Revo Reflect application.
        </p>

        <h2 className="text-xl font-semibold">1. Information We Collect</h2>
        <p className="text-slate-700 leading-relaxed">We may collect the following information:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Account email address and authentication information</li>
          <li>Your reflections, titles, and AI-generated suggestions</li>
          <li>Public reflections (if you choose to publish them)</li>
          <li>Basic analytics data to improve app performance</li>
        </ul>

        <h2 className="text-xl font-semibold">2. How We Use Your Information</h2>
        <p className="text-slate-700 leading-relaxed">We use your data to deliver core app functionality, improve AI suggestions, maintain user accounts, and enhance overall experience. We never sell your information.</p>

        <h2 className="text-xl font-semibold">3. Data Storage & Security</h2>
        <p className="text-slate-700 leading-relaxed">Your data is stored securely using Firebase Authentication, Firestore, and Vercel hosting. Industry-standard security practices are used.</p>

        <h2 className="text-xl font-semibold">4. Public Reflections</h2>
        <p className="text-slate-700 leading-relaxed">
          If you mark a reflection as public, its content becomes visible to all visitors.
          You may choose to publish anonymously or with your user ID/author name.
        </p>

        <h2 className="text-xl font-semibold">5. Your Rights</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Edit or delete any reflection</li>
          <li>Unpublish public reflections</li>
          <li>Delete your entire account and data</li>
        </ul>

        <h2 className="text-xl font-semibold">6. Third-Party Services</h2>
        <p className="text-slate-700 leading-relaxed">
          Revo Reflect uses Firebase (Authentication, Firestore), Vercel (hosting), and OpenAI API (AI suggestions).
          Each provider has its own privacy policy.
        </p>

        <h2 className="text-xl font-semibold">7. Updates</h2>
        <p className="text-slate-700 leading-relaxed">We may update this Privacy Policy occasionally. Updates will be posted on this page with a revised date.</p>

        <h2 className="text-xl font-semibold">8. Contact</h2>
        <p className="text-slate-700 leading-relaxed">Email: support@revoreflect.app (placeholder address)</p>
      </div>
    </section>
  );
}
