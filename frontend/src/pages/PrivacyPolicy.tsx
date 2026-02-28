import { Shield, Eye, Cookie, Megaphone, Lock, Baby, ExternalLink, RefreshCw, Mail } from 'lucide-react';
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

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-950 py-12 px-4">
      {/* Page Header */}
      <header className="mx-auto max-w-4xl mb-12 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-neon-blue/30 bg-neon-blue/10 px-4 py-1.5">
          <Shield size={14} className="text-neon-blue" />
          <span className="font-rajdhani text-sm font-semibold text-neon-blue tracking-widest uppercase">
            Legal
          </span>
        </div>
        <h1
          className="font-orbitron text-3xl font-black text-white sm:text-4xl lg:text-5xl mb-4"
          style={{ textShadow: '0 0 30px rgba(0,212,255,0.3)' }}
        >
          Privacy Policy
        </h1>
        <p className="font-rajdhani text-lg text-gray-400 max-w-2xl mx-auto">
          We believe in being transparent about how we handle your information. This policy explains what data we collect and how we use it.
        </p>
        <p className="mt-3 font-rajdhani text-sm text-gray-500">
          Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </header>

      {/* Policy Sections */}
      <main className="mx-auto max-w-4xl space-y-6">

        {/* 1. Introduction */}
        <PolicySection icon={<Shield size={20} />} title="Introduction">
          <p>
            Welcome to <strong className="text-white">Ultimate Gaming Arena</strong>. We respect your privacy and are committed to protecting any information related to your use of our website.
          </p>
          <p>
            Ultimate Gaming Arena is a free browser-based gaming platform that provides a wide variety of online games at no cost to our users. We want you to enjoy our games with confidence, knowing that your privacy is taken seriously.
          </p>
          <p>
            By using our website, you agree to the practices described in this Privacy Policy. Please take a moment to read through it — we've kept it simple and straightforward.
          </p>
        </PolicySection>

        {/* 2. Information We Collect */}
        <PolicySection icon={<Eye size={20} />} title="Information We Collect">
          <p>
            Since our games run entirely in your browser, we do not require you to create an account or provide any personal information to play. However, some non-personal data may be collected automatically:
          </p>
          <ul className="list-none space-y-2 mt-2">
            {[
              { label: 'Browser Type', desc: 'The type and version of browser you are using (e.g., Chrome, Firefox, Safari).' },
              { label: 'Device Type', desc: 'Whether you are visiting on a desktop, tablet, or mobile device.' },
              { label: 'IP Address', desc: 'Your approximate IP address, which may be used to determine your general geographic region.' },
              { label: 'Cookies', desc: 'Small data files stored in your browser to improve your experience (see Cookies Policy below).' },
              { label: 'Analytics Data', desc: 'Page views, session duration, and other usage statistics to help us understand how players use the site.' },
            ].map(({ label, desc }) => (
              <li key={label} className="flex items-start gap-3">
                <span
                  className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-neon-blue"
                  style={{ boxShadow: '0 0 6px rgba(0,212,255,0.6)' }}
                />
                <span>
                  <strong className="text-white">{label}:</strong> {desc}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-2">
            This information is collected in aggregate and is not used to personally identify you.
          </p>
        </PolicySection>

        {/* 3. Cookies Policy */}
        <PolicySection icon={<Cookie size={20} />} title="Cookies Policy">
          <p>
            Cookies are small text files that are placed on your device when you visit a website. We use cookies to:
          </p>
          <ul className="list-none space-y-2 mt-2">
            {[
              'Remember your game preferences and settings.',
              'Keep track of your high scores and progress stored locally.',
              'Analyze how visitors use our site so we can improve the experience.',
              'Serve relevant advertisements through third-party ad networks.',
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
            <strong className="text-white">Third-party advertisers</strong> may also place cookies on your device when you visit our site. These cookies are used to show you ads that may be relevant to your interests. We do not control these third-party cookies.
          </p>
          <p>
            You can control or disable cookies through your browser settings at any time. Note that disabling cookies may affect some features of the site.
          </p>
        </PolicySection>

        {/* 4. Google AdSense & Third-Party Ads */}
        <PolicySection icon={<Megaphone size={20} />} title="Google AdSense & Third-Party Ads">
          <p>
            Ultimate Gaming Arena is a free platform supported by advertising. We use <strong className="text-white">Google AdSense</strong> and other third-party advertising companies to display ads on our site.
          </p>
          <p>
            These advertising companies may use cookies, web beacons, and similar tracking technologies to:
          </p>
          <ul className="list-none space-y-2 mt-2">
            {[
              'Serve ads based on your previous visits to our site and other websites.',
              'Measure the effectiveness of their advertisements.',
              'Understand your browsing behavior across different websites.',
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
            Google's use of advertising cookies enables it and its partners to serve ads based on your visit to our site and/or other sites on the Internet.
          </p>
          <p>
            You can opt out of personalized advertising by visiting{' '}
            <a
              href="https://www.google.com/settings/ads"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neon-blue hover:underline font-semibold"
              style={{ textShadow: '0 0 8px rgba(0,212,255,0.4)' }}
            >
              Google's Ad Settings
            </a>
            . You can also visit{' '}
            <a
              href="https://www.aboutads.info/choices/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neon-blue hover:underline font-semibold"
              style={{ textShadow: '0 0 8px rgba(0,212,255,0.4)' }}
            >
              aboutads.info
            </a>{' '}
            to opt out of interest-based advertising from participating companies.
          </p>
        </PolicySection>

        {/* 5. Data Security */}
        <PolicySection icon={<Lock size={20} />} title="Data Security">
          <p>
            We take the security of your information seriously. Here's what you should know:
          </p>
          <ul className="list-none space-y-2 mt-2">
            {[
              'We do NOT sell your personal data to any third parties — ever.',
              'We do NOT collect sensitive personal information such as your name, email address, or payment details.',
              'We take reasonable technical measures to protect any data that passes through our site.',
              'Game progress and scores are stored locally in your browser and never transmitted to our servers.',
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span
                  className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-green-400"
                  style={{ boxShadow: '0 0 6px rgba(74,222,128,0.6)' }}
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3">
            While we strive to protect your information, please be aware that no method of transmission over the Internet is 100% secure. We encourage you to use the internet responsibly.
          </p>
        </PolicySection>

        {/* 6. Children's Privacy */}
        <PolicySection icon={<Baby size={20} />} title="Children's Privacy">
          <p>
            The safety of children online is very important to us.
          </p>
          <p>
            <strong className="text-white">Ultimate Gaming Arena does not knowingly collect personal information from children under the age of 13.</strong> Our website is intended for general audiences, and we do not direct our services specifically at children under 13.
          </p>
          <p>
            If you are a parent or guardian and believe that your child has provided us with personal information, please contact us immediately at the email address listed in the Contact section below. We will take prompt steps to remove such information from our records.
          </p>
        </PolicySection>

        {/* 7. External Links */}
        <PolicySection icon={<ExternalLink size={20} />} title="External Links">
          <p>
            Our website may contain links to third-party websites, including links within advertisements. These external sites are not operated by us.
          </p>
          <p>
            <strong className="text-white">We are not responsible for the privacy practices or content of any third-party websites.</strong> We have no control over and assume no responsibility for the content, privacy policies, or practices of any third-party sites or services.
          </p>
          <p>
            We strongly advise you to review the Privacy Policy of every website you visit. Clicking on third-party links is done at your own discretion.
          </p>
        </PolicySection>

        {/* 8. Changes to Policy */}
        <PolicySection icon={<RefreshCw size={20} />} title="Changes to This Policy">
          <p>
            We may update this Privacy Policy from time to time to reflect changes in our practices, technology, or legal requirements.
          </p>
          <p>
            When we make changes, we will update the "Last updated" date at the top of this page. <strong className="text-white">Your continued use of Ultimate Gaming Arena after any changes constitutes your acceptance of the updated policy.</strong>
          </p>
          <p>
            We recommend checking this page periodically to stay informed about how we protect your information. We will not notify users of changes via email since we do not collect email addresses.
          </p>
        </PolicySection>

        {/* 9. Contact Information */}
        <PolicySection icon={<Mail size={20} />} title="Contact Information">
          <p>
            If you have any questions, concerns, or requests regarding this Privacy Policy or how we handle your data, please don't hesitate to reach out to us.
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
            We aim to respond to all privacy-related inquiries within a reasonable timeframe.
          </p>
        </PolicySection>

      </main>

      {/* Bottom note */}
      <div className="mx-auto max-w-4xl mt-10 text-center">
        <p className="font-rajdhani text-sm text-gray-600">
          This Privacy Policy applies to the Ultimate Gaming Arena website only. By using our site, you acknowledge that you have read and understood this policy.
        </p>
        <p className="mt-3 font-rajdhani text-sm text-gray-600">
          Also see our{' '}
          <Link
            to="/terms-of-service"
            className="text-neon-blue/70 hover:text-neon-blue hover:underline transition-colors"
          >
            Terms of Service
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
