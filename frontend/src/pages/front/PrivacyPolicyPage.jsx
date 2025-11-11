import { Separator } from "@/components/ui/separator";
import { Mail } from "lucide-react";
import Header from "./Header";
import herobg from "../../assets/herobg.webp";

export default function PrivacyPolicy() {
  return (
    <>
      <Header />
      <section className="relative overflow-hidden bg-white dark:bg-[#0D0D0D] h-32 flex items-center justify-center">
                      {/* Background Image */}
                      <img src={herobg} alt="Hero Background" className="absolute inset-0 object-cover w-full h-32 z-0" />
    </section>
    <div className="max-w-4xl mx-auto px-6 py-16 text-[#1E1E1E] dark:text-white">
      <h1 className="text-4xl font-bold mb-6 text-[#16bf4c]">Privacy Policy</h1>
      <p className="text-sm text-gray-500 mb-10">Last Updated: October 22, 2025</p>

      <section className="space-y-6">
        <p>
          Welcome to <strong>Custovra</strong> (“we,” “our,” or “us”). This Privacy Policy explains how we collect, use,
          disclose, and protect your information when you use our platform and services (collectively, the “Service”).
        </p>
        <p>
          By accessing or using Custovra, you agree to the terms of this Privacy Policy. If you do not agree, please do
          not use our Service.
        </p>
      </section>

      <Separator className="my-10" />

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">1. Information We Collect</h2>
        <p>We collect the following types of information when you use our Service:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Account Information:</strong> Your name, email address, password, and business details when you
            register for an account.
          </li>
          <li>
            <strong>Payment Information:</strong> Billing details, payment method, and transaction history, processed
            securely through our payment gateway partner (e.g., Stripe). We do not store your credit card information.
          </li>
          <li>
            <strong>Feedback Data:</strong> Information submitted by your customers through your forms (e.g., reviews,
            complaints, ratings, and comments).
          </li>
          <li>
            <strong>Usage Data:</strong> Analytics data such as IP address, browser type, device information, and pages
            visited to help us improve performance and user experience.
          </li>
        </ul>
      </section>

      <Separator className="my-10" />

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">2. How We Use Your Information</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>To provide, operate, and maintain the Custovra platform.</li>
          <li>To process payments and manage subscriptions.</li>
          <li>To communicate important updates or service-related notifications.</li>
          <li>To analyze usage trends and improve our products and services.</li>
          <li>To ensure compliance with legal obligations and prevent misuse or fraud.</li>
        </ul>
      </section>

      <Separator className="my-10" />

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">3. Data Ownership and Access</h2>
        <p>
          You retain full ownership of the feedback and data collected through your forms. We do not sell or share your
          collected data with third parties for marketing purposes.
        </p>
        <p>
          We only process your data to operate and support the Service and provide insights and analytics to you and
          your authorized users.
        </p>
      </section>

      <Separator className="my-10" />

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">4. Data Retention</h2>
        <p>
          We retain your data for as long as your account is active or as needed to provide our Service. Upon
          cancellation or termination, we may retain limited information for legal, billing, or dispute resolution
          purposes.
        </p>
      </section>

      <Separator className="my-10" />

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">5. Sharing of Information</h2>
        <p>
          We do not share your personal data except in the following situations:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Service Providers:</strong> We may use trusted third-party services (e.g., cloud hosting, payment
            processors) to help operate our platform.
          </li>
          <li>
            <strong>Legal Requirements:</strong> We may disclose your information if required by law, regulation, or
            legal request.
          </li>
          <li>
            <strong>Business Transfers:</strong> In case of a merger, acquisition, or asset sale, your data may be
            transferred to the new entity under similar privacy commitments.
          </li>
        </ul>
      </section>

      <Separator className="my-10" />

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">6. Data Security</h2>
        <p>
          We use modern encryption, access control, and monitoring technologies to safeguard your data. However, no
          online system is completely secure. While we strive to protect your data, we cannot guarantee absolute
          security.
        </p>
      </section>

      <Separator className="my-10" />

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">7. Cookies and Analytics</h2>
        <p>
          Custovra uses cookies and similar technologies to enhance your browsing experience, analyze traffic, and
          improve functionality. You can disable cookies in your browser settings, but some features may not function
          properly as a result.
        </p>
      </section>

      <Separator className="my-10" />

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">8. Your Rights</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Access and request a copy of the data we hold about you.</li>
          <li>Request correction or deletion of your personal data.</li>
          <li>Withdraw consent where applicable.</li>
          <li>Object to processing for specific purposes (subject to legal obligations).</li>
        </ul>
        <p>
          To exercise these rights, please contact us at{" "}
          <a href="mailto:info@custovra.com" className="text-[#16bf4c] hover:underline">
            info@custovra.com
          </a>.
        </p>
      </section>

      <Separator className="my-10" />

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">9. Data Transfers</h2>
        <p>
          If you are accessing Custovra from outside Sri Lanka, please note that your information may be transferred to
          and processed in servers located in other countries where our infrastructure or partners operate.
        </p>
      </section>

      <Separator className="my-10" />

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">10. Updates to this Policy</h2>
        <p>
          We may update this Privacy Policy periodically. Any changes will be posted on this page with the updated
          effective date. Continued use of the Service after such updates constitutes your acceptance of the revised
          policy.
        </p>
      </section>

      <Separator className="my-10" />

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">11. Contact Us</h2>
        <div className="flex items-center gap-2">
          <Mail className="w-5 h-5 text-[#16bf4c]" />
          <a href="mailto:info@custovra.com" className="text-[#16bf4c] hover:underline">
            info@custovra.com
          </a>
        </div>
      </section>
    </div>
    </>
  );
}
