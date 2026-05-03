import { PageHeader } from "@/components/AppLayout";
import { SurfaceCard } from "@/components/SurfaceCard";

export default function PrivacyPolicy() {
  return (
    <div>
      <PageHeader title="Privacy Policy" subtitle="Your data, your control" showBack />
      
      <div className="px-5 pb-12 space-y-6">
        <SurfaceCard padding="lg" className="prose prose-sm prose-slate dark:prose-invert max-w-none">
          <h2 className="text-lg font-bold text-ink">1. Data Collection</h2>
          <p className="text-sm text-ink-soft leading-relaxed">
            We collect information you provide directly, such as your name, email, and expense data. We also collect technical data like device information and app usage statistics.
          </p>

          <h2 className="text-lg font-bold text-ink mt-6">2. Data Usage</h2>
          <p className="text-sm text-ink-soft leading-relaxed">
            Your data is used to provide and improve the SmartSplit service. We do not sell your personal information to third parties.
          </p>

          <h2 className="text-lg font-bold text-ink mt-6">3. Data Security</h2>
          <p className="text-sm text-ink-soft leading-relaxed">
            We use Firebase (a Google service) to securely store and process your data. We implement industry-standard security measures to protect your information.
          </p>

          <h2 className="text-lg font-bold text-ink mt-6">4. Your Rights</h2>
          <p className="text-sm text-ink-soft leading-relaxed">
            You have the right to access, correct, or delete your personal data. You can delete your account and all associated data directly from the Profile settings.
          </p>

          <h2 className="text-lg font-bold text-ink mt-6">5. Changes</h2>
          <p className="text-sm text-ink-soft leading-relaxed">
            We may update this policy from time to time. We will notify you of any significant changes by updating the "Last updated" date.
          </p>
        </SurfaceCard>
      </div>
    </div>
  );
}
