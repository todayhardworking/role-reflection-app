export default function TermsOfServicePage() {
  const today = new Date().toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <section className="max-w-3xl mx-auto px-6 py-12 space-y-8">
      <h1 className="text-2xl font-bold text-slate-900">Terms of Service</h1>
      <p className="text-slate-600">Last updated: {today}</p>

      <div className="space-y-6 text-slate-700 leading-relaxed">
        <p>
          Welcome to Revo Reflect (“we”, “our”, or “the app”). By accessing or
          using this service, you agree to be bound by the terms described here.
          If you do not agree with these terms, please discontinue using the app.
        </p>

        <h2 className="text-xl font-semibold">1. Use of the Service</h2>
        <p>
          Revo Reflect allows users to create, store, and analyze reflections with the
          assistance of AI-generated suggestions. You agree to use the service 
          responsibly and in compliance with applicable laws.
        </p>

        <h2 className="text-xl font-semibold">2. User Accounts</h2>
        <p>
          You are responsible for maintaining the confidentiality of your account
          credentials. Any actions performed under your account are your responsibility.
        </p>

        <h2 className="text-xl font-semibold">3. User Content</h2>
        <p>
          You retain full ownership of your reflections and content. By using the app,
          you grant us a limited license to store, process, and analyze your content
          solely for providing app functionality.
        </p>

        <h2 className="text-xl font-semibold">4. Public Reflections</h2>
        <p>
          If you choose to publish a reflection publicly, you understand that it becomes
          visible to all visitors. You may publish anonymously or with your user ID.
        </p>

        <h2 className="text-xl font-semibold">5. AI-Generated Suggestions</h2>
        <p>
          AI suggestions are generated to assist your reflection process. They may not be
          accurate or applicable in all situations. You agree to use them at your discretion.
        </p>

        <h2 className="text-xl font-semibold">6. Prohibited Activities</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Posting harmful, illegal, or abusive content</li>
          <li>Attempting to compromise app security</li>
          <li>Using the service to mislead, impersonate, or harm others</li>
          <li>Reverse engineering or tampering with the platform</li>
        </ul>

        <h2 className="text-xl font-semibold">7. Termination</h2>
        <p>
          We reserve the right to suspend or terminate your access if you violate these
          terms or misuse the platform.
        </p>

        <h2 className="text-xl font-semibold">8. Third-Party Services</h2>
        <p>
          Revo Reflect uses Firebase, Vercel, and OpenAI APIs. These providers have their
          own terms and privacy policies, which also apply to your use of the service.
        </p>

        <h2 className="text-xl font-semibold">9. Limitation of Liability</h2>
        <p>
          The app is provided “as is” without warranties of any kind. We are not liable
          for any indirect, incidental, or consequential damages arising from your use
          of the service.
        </p>

        <h2 className="text-xl font-semibold">10. Changes to These Terms</h2>
        <p>
          We may update these Terms of Service occasionally. Continued use of the app
          constitutes acceptance of any updated terms.
        </p>

      </div>
    </section>
  );
}
