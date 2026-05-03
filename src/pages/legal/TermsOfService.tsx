import { PageHeader } from "@/components/AppLayout";
import { SurfaceCard } from "@/components/SurfaceCard";

export default function TermsOfService() {
  return (
    <div>
      <PageHeader title="Terms of Service" subtitle="Last updated May 2026" showBack />
      
      <div className="px-5 pb-12 space-y-6">
        <SurfaceCard padding="lg" className="prose prose-sm prose-slate dark:prose-invert max-w-none">
          <h2 className="text-lg font-bold text-ink">1. Agreement to Terms</h2>
          <p className="text-sm text-ink-soft leading-relaxed">
            By accessing or using Split, provided by DAVNS Industries, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the service.
          </p>

          <h2 className="text-lg font-bold text-ink mt-6">2. Use of Service</h2>
          <p className="text-sm text-ink-soft leading-relaxed">
            Split is a tool for tracking shared expenses. You are responsible for the accuracy of the data you enter. We do not handle actual financial transactions between users.
          </p>

          <h2 className="text-lg font-bold text-ink mt-6">3. User Accounts</h2>
          <p className="text-sm text-ink-soft leading-relaxed">
            You are responsible for maintaining the confidentiality of your account credentials. You must notify us immediately of any unauthorized use of your account.
          </p>

          <h2 className="text-lg font-bold text-ink mt-6">4. Privacy</h2>
          <p className="text-sm text-ink-soft leading-relaxed">
            Your use of the service is also governed by our Privacy Policy. Please review it to understand how we collect and use your data.
          </p>

          <h2 className="text-lg font-bold text-ink mt-6">5. Limitation of Liability</h2>
          <p className="text-sm text-ink-soft leading-relaxed">
            DAVNS Industries shall not be liable for any indirect, incidental, or consequential damages resulting from your use of the service.
          </p>
        </SurfaceCard>
      </div>
    </div>
  );
}
