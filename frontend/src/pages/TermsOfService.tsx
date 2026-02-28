import { FileText, Gamepad2, ShieldAlert, Copyright, AlertTriangle, Scale, Globe, Mail } from 'lucide-react';
import { Link } from '@tanstack/react-router';

interface PolicySectionProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}

function PolicySection({ icon, title, children }: PolicySectionProps) {
  return (
    <section className="rounded-2xl border border-neon-blue/15 bg-gray-900/60 p-6 sm:p-8 backdrop-blur-sm">
      <div className="mb-4 flex items-center gap-3">
        <div
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-neon-blue/30 bg-neon-blue/10"
          style={{ boxShadow: '0 0 12px rgba(0,212,255,0.15)' }}
        >
          <span className="text-neon-blue">{icon}</span>
        </div>
        <h2
          className="font-orbitron text-lg font-bold text-neon-blue sm:text-xl"
          style={{ textShadow: '0 0 10px rgba(0,212,255,0.4)' }}
        >
          {title}
        </h2>
      </div>
      <div className="font-rajdhani text-base leading-relaxed text-gray-300 space-y-3">
        {children}
      </div>
    </section>
  );
}

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-950 py-12 px-4">
      {/* Page Header */}
      <header className="mx-auto max-w-4xl mb-12 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-neon-blue/30 bg-neon-blue/10 px-4 py-1.5">
          <FileText size={14} className="text-neon-blue" />
          <span className="font-rajdhani text-sm font-semibold text-neon-blue tracking-widest uppercase">
            Legal
          </span>
        </div>
        <h1
          className="font-orbitron text-3xl font-black text-white sm:text-4xl lg:text-5xl mb-4"
          style={{ textShadow: '0 0 30px rgba(0,212,255,0.3)' }}
        >
          Terms of Service
        </h1>
        <p className="font-rajdhani text-lg text-gray-400 max-w-2xl mx-auto">
          Please read these terms carefully before using Ultimate Gaming Arena. By accessing our platform, you agree to be bound by these terms.
        </p>
        <p className="mt-3 font-rajdhani text-sm text-gray-500">
          Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </header>

      {/* Terms Sections */}
      <main className="mx-auto max-w-4xl space-y-6">

        {/* 1. Agreement to Terms */}
        <PolicySection icon={<FileText size={20} />} title="Agreement to Terms">
          <p>
            Welcome to <strong className="text-white">Ultimate Gaming Arena</strong>. These Terms of Service ("Terms") govern your access to and use of our website, games, and related services (collectively, the "Service").
          </p>
          <p>
            By accessing or using Ultimate Gaming Arena, you confirm that you are at least 13 years of age, have read and understood these Terms, and agree to be legally bound by them. If you do not agree to these Terms, please do not use our Service.
          </p>
          <p>
            We reserve the right to update or modify these Terms at any time. Your continued use of the Service after any changes constitutes your acceptance of the revised Terms. We encourage you to review this page periodically.
          </p>
        </PolicySection>

        {/* 2. Use of Service */}
        <PolicySection icon={<Gamepad2 size={20} />} title="Use of Service">
          <p>
            Ultimate Gaming Arena grants you a limited, non-exclusive, non-transferable, revocable license to access and use the Service for your personal, non-commercial entertainment purposes.
          </p>
          <p>
            You may use our Service provided that you:
          </p>
          <ul className="list-none space-y-2 mt-2">
            {[
              'Access the Service only for lawful purposes and in accordance with these Terms.',
              'Do not attempt to gain unauthorized access to any part of the Service or its related systems.',
              'Do not use automated tools, bots, or scripts to interact with the Service.',
              'Do not attempt to reverse-engineer, decompile, or disassemble any part of the Service.',
              'Do not interfere with or disrupt the integrity or performance of the Service.',
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span
                  className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-neon-blue"
                  style={{ boxShadow: '0 0 6px rgba(0,212,255,0.6)' }}
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3">
            We reserve the right to suspend or terminate access to the Service for any user who violates these Terms, without prior notice.
          </p>
        </PolicySection>

        {/* 3. User Conduct & Prohibited Activities */}
        <PolicySection icon={<ShieldAlert size={20} />} title="User Conduct & Prohibited Activities">
          <p>
            While using Ultimate Gaming Arena, you agree not to engage in any of the following prohibited activities:
          </p>
          <ul className="list-none space-y-2 mt-2">
            {[
              { label: 'Cheating or Exploiting', desc: 'Using hacks, cheats, exploits, or unauthorized third-party software to gain an unfair advantage in any game.' },
              { label: 'Harmful Content', desc: 'Uploading, transmitting, or distributing any content that is unlawful, harmful, threatening, abusive, or otherwise objectionable.' },
              { label: 'Impersonation', desc: 'Impersonating any person or entity, or falsely claiming an affiliation with any person or entity.' },
              { label: 'Data Mining', desc: 'Collecting or harvesting any personally identifiable information from the Service.' },
              { label: 'Commercial Use', desc: 'Using the Service for any commercial purpose without our express written consent.' },
            ].map(({ label, desc }) => (
              <li key={label} className="flex items-start gap-3">
                <span
                  className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-neon-purple"
                  style={{ boxShadow: '0 0 6px rgba(168,85,247,0.6)' }}
                />
                <span>
                  <strong className="text-white">{label}:</strong> {desc}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3">
            Violation of these conduct rules may result in immediate termination of your access to the Service and, where applicable, referral to appropriate legal authorities.
          </p>
        </PolicySection>

        {/* 4. Intellectual Property */}
        <PolicySection icon={<Copyright size={20} />} title="Intellectual Property Rights">
          <p>
            The Service and its original content, features, and functionality are and will remain the exclusive property of Ultimate Gaming Arena and its licensors.
          </p>
          <p>
            All materials on this website — including but not limited to game code, graphics, artwork, audio, text, logos, and user interface designs — are protected by applicable intellectual property laws, including copyright and trademark laws.
          </p>
          <ul className="list-none space-y-2 mt-2">
            {[
              'You may not copy, reproduce, distribute, or create derivative works from any content on this site without our express written permission.',
              'The "Ultimate Gaming Arena" name and logo are trademarks of this platform and may not be used without prior written consent.',
              'Any feedback, suggestions, or ideas you provide to us may be used by us without any obligation to compensate you.',
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span
                  className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-neon-blue"
                  style={{ boxShadow: '0 0 6px rgba(0,212,255,0.6)' }}
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </PolicySection>

        {/* 5. Disclaimers of Warranties */}
        <PolicySection icon={<AlertTriangle size={20} />} title="Disclaimers of Warranties">
          <p>
            The Service is provided on an <strong className="text-white">"AS IS" and "AS AVAILABLE"</strong> basis, without any warranties of any kind, either express or implied.
          </p>
          <p>
            To the fullest extent permitted by applicable law, Ultimate Gaming Arena expressly disclaims all warranties, including but not limited to:
          </p>
          <ul className="list-none space-y-2 mt-2">
            {[
              'Implied warranties of merchantability, fitness for a particular purpose, and non-infringement.',
              'Any warranty that the Service will be uninterrupted, error-free, or free of viruses or other harmful components.',
              'Any warranty regarding the accuracy, reliability, or completeness of any content on the Service.',
              'Any warranty that defects in the Service will be corrected.',
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span
                  className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-yellow-400"
                  style={{ boxShadow: '0 0 6px rgba(250,204,21,0.6)' }}
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3">
            Some jurisdictions do not allow the exclusion of implied warranties, so some of the above exclusions may not apply to you.
          </p>
        </PolicySection>

        {/* 6. Limitation of Liability */}
        <PolicySection icon={<Scale size={20} />} title="Limitation of Liability">
          <p>
            To the maximum extent permitted by applicable law, Ultimate Gaming Arena and its affiliates, officers, employees, agents, partners, and licensors shall not be liable for any indirect, incidental, special, consequential, or punitive damages.
          </p>
          <p>
            This includes, without limitation, damages for:
          </p>
          <ul className="list-none space-y-2 mt-2">
            {[
              'Loss of profits, data, use, goodwill, or other intangible losses.',
              'Unauthorized access to or alteration of your transmissions or data.',
              'Any conduct or content of any third party on the Service.',
              'Any content obtained from the Service.',
              'Unauthorized access, use, or alteration of your transmissions or content.',
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span
                  className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-neon-purple"
                  style={{ boxShadow: '0 0 6px rgba(168,85,247,0.6)' }}
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3">
            In no event shall our total liability to you for all claims exceed the amount you paid us in the past twelve (12) months, or $100 USD, whichever is greater. Since our Service is free, this effectively means our liability is limited to the maximum extent permitted by law.
          </p>
        </PolicySection>

        {/* 7. Governing Law & Dispute Resolution */}
        <PolicySection icon={<Globe size={20} />} title="Governing Law & Dispute Resolution">
          <p>
            These Terms shall be governed by and construed in accordance with applicable laws, without regard to conflict of law principles.
          </p>
          <p>
            <strong className="text-white">Informal Resolution:</strong> Before filing a formal legal claim, we encourage you to contact us first. Many disputes can be resolved quickly and informally. Please reach out to us at the contact information provided below.
          </p>
          <p>
            <strong className="text-white">Binding Arbitration:</strong> If informal resolution fails, any dispute arising out of or relating to these Terms or the Service shall be resolved through binding arbitration, rather than in court, except that you may assert claims in small claims court if your claims qualify.
          </p>
          <p>
            <strong className="text-white">Class Action Waiver:</strong> You agree that any dispute resolution proceedings will be conducted only on an individual basis and not in a class, consolidated, or representative action.
          </p>
        </PolicySection>

        {/* 8. Contact Information */}
        <PolicySection icon={<Mail size={20} />} title="Contact Information">
          <p>
            If you have any questions, concerns, or requests regarding these Terms of Service, please don't hesitate to reach out to us.
          </p>
          <div className="mt-4 rounded-xl border border-neon-blue/20 bg-neon-blue/5 p-4">
            <p className="font-semibold text-white mb-1">Email us at:</p>
            <a
              href="mailto:contact@yourwebsite.com"
              className="text-neon-blue hover:underline font-orbitron text-base font-bold"
              style={{ textShadow: '0 0 10px rgba(0,212,255,0.5)' }}
            >
              contact@yourwebsite.com
            </a>
          </div>
          <p className="mt-3">
            We aim to respond to all legal inquiries within a reasonable timeframe. For privacy-related questions, please refer to our{' '}
            <Link
              to="/privacy-policy"
              className="text-neon-blue hover:underline font-semibold"
              style={{ textShadow: '0 0 8px rgba(0,212,255,0.4)' }}
            >
              Privacy Policy
            </Link>
            .
          </p>
        </PolicySection>

      </main>

      {/* Bottom note */}
      <div className="mx-auto max-w-4xl mt-10 text-center">
        <p className="font-rajdhani text-sm text-gray-600">
          These Terms of Service apply to the Ultimate Gaming Arena website only. By using our site, you acknowledge that you have read, understood, and agree to be bound by these Terms.
        </p>
        <p className="mt-3 font-rajdhani text-sm text-gray-600">
          Also see our{' '}
          <Link
            to="/privacy-policy"
            className="text-neon-blue/70 hover:text-neon-blue hover:underline transition-colors"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
