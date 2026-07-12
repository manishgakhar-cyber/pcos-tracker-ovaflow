import { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';

export const HelpButton = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Help and privacy policy"
        size="icon"
        className="fixed bottom-4 right-4 z-50 h-12 w-12 rounded-full shadow-lg bg-purple-600 hover:bg-purple-700 text-white"
      >
        <HelpCircle className="h-6 w-6" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="text-2xl text-purple-800">OvaFlow Privacy Policy</DialogTitle>
            <DialogDescription>Last updated: July 12, 2026</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[65vh] pr-4">
            <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
              <section>
                <h3 className="font-semibold text-purple-800 mb-1">1. Who we are</h3>
                <p>
                  OvaFlow is a personal PCOS and menstrual cycle tracking companion. This policy
                  explains what information we collect, how it is stored, and the rights you have
                  over it.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-purple-800 mb-1">2. Information we collect</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Account data:</strong> first name, last name, email address, and an encrypted password.</li>
                  <li><strong>Health data you enter:</strong> period dates and flow, symptoms, mood, energy, cervical mucus, weight and height (imperial units), and PCOS assessment answers.</li>
                  <li><strong>Derived data:</strong> cycle predictions, phase estimates, and PCOS risk scores generated from your entries.</li>
                  <li><strong>Optional feedback:</strong> ratings and comments you voluntarily submit.</li>
                </ul>
                <p className="mt-2">We do not collect location data, device contacts, or advertising identifiers.</p>
              </section>

              <section>
                <h3 className="font-semibold text-purple-800 mb-1">3. How your data is stored</h3>
                <p>
                  Your data is stored in an encrypted managed Postgres database hosted on our
                  backend infrastructure. Row Level Security is enabled on every table, which
                  means each row is scoped to your user account and is not readable by other
                  users. Passwords are hashed and never stored in plain text.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-purple-800 mb-1">4. AI processing</h3>
                <p>
                  Your PCOS assessment answers are sent to a large language model (Google Gemini
                  via a server-side gateway) to generate an educational risk summary. Your name
                  and email are not included in the prompt. The AI provider processes the request
                  transiently and does not train on your inputs.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-purple-800 mb-1">5. Sharing</h3>
                <p>
                  We do not sell your data. We do not share it with advertisers or data brokers.
                  Data is only shared with the infrastructure providers required to operate the
                  app (hosting, database, AI gateway) under their standard data processing terms.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-purple-800 mb-1">6. Your rights</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Access and edit any entry from the Tracker and Calendar tabs.</li>
                  <li>Retake or update your PCOS assessment at any time.</li>
                  <li>Request full deletion of your account and associated data by contacting us.</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-purple-800 mb-1">7. Data retention</h3>
                <p>
                  Your data is retained for as long as your account is active. When you delete
                  your account, your profile, cycle entries, symptoms, assessments, and feedback
                  are permanently removed from the primary database within 30 days.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-purple-800 mb-1">8. Medical disclaimer</h3>
                <p>
                  OvaFlow is an educational tracking tool, not a medical device. Predictions and
                  PCOS risk scores are informational only and are not a diagnosis. Always consult
                  a qualified healthcare provider for medical decisions.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-purple-800 mb-1">9. Children</h3>
                <p>
                  OvaFlow is not intended for users under 13. If you believe a child has created
                  an account, contact us and we will delete it.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-purple-800 mb-1">10. Contact</h3>
                <p>
                  Questions about your data or this policy? Reach us at
                  {' '}<a href="mailto:privacy@ovaflow.app" className="text-purple-700 underline">privacy@ovaflow.app</a>.
                </p>
              </section>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};