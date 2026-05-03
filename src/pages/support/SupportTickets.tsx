import { useState } from "react";
import { PageHeader } from "@/components/AppLayout";
import { SurfaceCard } from "@/components/SurfaceCard";
import { toast } from "sonner";
import { MessageSquare, Send, Clock, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SupportTickets() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !message) return toast.error("Please fill all fields");
    
    setSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setSubmitting(false);
      setSent(true);
      setSubject("");
      setMessage("");
    }, 1500);
  };

  return (
    <div>
      <PageHeader title="Support Tickets" subtitle="How can we help?" showBack />
      
      <div className="px-5 pb-12 space-y-6">
        {sent ? (
          <SurfaceCard padding="lg" className="text-center py-12">
            <div className="size-20 rounded-full bg-success/10 text-success flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="size-10" />
            </div>
            <h2 className="text-xl font-bold text-ink">Ticket Created!</h2>
            <p className="text-sm text-ink-soft mt-2 mb-8">Our team will get back to you via email within 24 hours.</p>
            <button 
              onClick={() => setSent(false)}
              className="px-8 py-3 bg-brand text-white rounded-full font-bold shadow-brand"
            >
              Create another
            </button>
          </SurfaceCard>
        ) : (
          <>
            <SurfaceCard padding="lg">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-ink-soft uppercase tracking-widest ml-1">Subject</label>
                  <input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Brief summary of the issue"
                    className="w-full bg-surface-soft rounded-2xl px-5 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-brand mt-1"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-ink-soft uppercase tracking-widest ml-1">Message</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe your issue in detail..."
                    rows={5}
                    className="w-full bg-surface-soft rounded-2xl px-5 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-brand mt-1 resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-brand text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-brand hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  {submitting ? "Sending..." : "Submit Ticket"}
                  <Send className="size-4" />
                </button>
              </form>
            </SurfaceCard>

            <div className="space-y-3">
              <h3 className="text-xs font-bold text-ink-soft uppercase tracking-widest ml-1">Previous Tickets</h3>
              <SurfaceCard padding="md" className="flex items-center justify-between opacity-60 grayscale cursor-not-allowed">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-surface-soft flex items-center justify-center text-ink-soft">
                    <MessageSquare className="size-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-ink">Payment synchronization</p>
                    <p className="text-[10px] text-ink-soft flex items-center gap-1">
                      <Clock className="size-3" /> Closed · 2 days ago
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-ink-soft bg-surface-soft px-2 py-1 rounded-full uppercase">Details</span>
              </SurfaceCard>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
