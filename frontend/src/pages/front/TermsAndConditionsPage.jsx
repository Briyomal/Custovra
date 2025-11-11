import { Separator } from "@/components/ui/separator";
import { Mail } from "lucide-react";
import Header from "./Header";
import herobg from "../../assets/herobg.webp";

export default function TermsAndConditions() {
  return (
    <>
              <Header />
                    <section className="relative overflow-hidden bg-white dark:bg-[#0D0D0D] h-32 flex items-center justify-center">
                                    {/* Background Image */}
                                    <img src={herobg} alt="Hero Background" className="absolute inset-0 object-cover w-full h-32 z-0" />
                  </section>
                  <div className="max-w-4xl mx-auto px-6 py-16 text-[#1E1E1E] dark:text-white">
      <h1 className="text-4xl font-bold mb-6 text-[#16bf4c]">Terms and Conditions</h1>
      <p className="text-sm text-gray-500 mb-10">Last Updated: October 22, 2025</p>

      <section className="space-y-6">
        <p>
          Welcome to <strong>Custovra</strong> (“we,” “our,” or “us”). By accessing or using our platform and services
          (collectively, the “Service”), you agree to comply with and be bound by the following Terms and Conditions
          (“Terms”). Please read these Terms carefully before using Custovra.
        </p>
        <p>If you do not agree with these Terms, you must not use our Service.</p>
      </section>

      <Separator className="my-10" />

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">1. Overview of Service</h2>
        <p>
          Custovra is a SaaS-based platform that allows merchants to create and manage feedback forms, including reviews
          and complaints. Merchants can share links or QR codes with customers to collect feedback and generate reports.
          Some subscription plans allow adding employees for specific feedback collection.
        </p>
      </section>

      <Separator className="my-10" />

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">2. Account Registration</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>You must create an account and provide accurate information to use Custovra.</li>
          <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
          <li>You are solely responsible for all activities that occur under your account.</li>
          <li>
            We reserve the right to suspend or terminate accounts that violate these Terms or misuse the platform.
          </li>
        </ul>
      </section>

      <Separator className="my-10" />

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">3. Subscription and Payments</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Custovra operates on a subscription basis. You must pay the applicable fees before accessing premium features.</li>
          <li><strong>We do not provide free trials.</strong></li>
          <li>All fees are listed in your selected currency and are payable in advance.</li>
          <li>
            <strong>Discounts</strong> (if any) are valid only during the promotional period and{" "}
            <strong>will not apply automatically upon renewal.</strong>
          </li>
          <li><strong>All payments are non-refundable</strong>, including partial usage, termination, or dissatisfaction.</li>
          <li>
            We reserve the right to <strong>change pricing or subscription plans at any time</strong>, with reasonable
            notice to active subscribers.
          </li>
        </ul>
      </section>

      <Separator className="my-10" />

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">4. Use of Service</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Use Custovra only for lawful business purposes.</li>
          <li>
            Do not use the Service to collect sensitive or illegal content (e.g., hate speech, harassment, or confidential data).
          </li>
          <li>Do not attempt to hack, copy, reverse-engineer, or disrupt the Service or its servers.</li>
          <li>Ensure your data collection complies with applicable privacy and data protection laws.</li>
        </ul>
      </section>

      <Separator className="my-10" />

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">5. Data and Privacy</h2>
        <p>
          You retain ownership of the data you collect using Custovra. We do not claim rights over your collected
          feedback data. However, by using our Service, you grant us permission to store and process your data as
          necessary to operate the platform. Please refer to our <strong>Privacy Policy</strong> for more information.
        </p>
      </section>

      <Separator className="my-10" />

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">6. Intellectual Property</h2>
        <p>
          All materials, branding, designs, and code related to Custovra are the property of{" "}
          <strong>Custovra (Pvt) Ltd.</strong> You may not copy, reproduce, or distribute any part of the platform
          without written consent.
        </p>
      </section>

      <Separator className="my-10" />

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">7. Service Availability</h2>
        <p>
          We strive to maintain uninterrupted access to our Service but do not guarantee continuous or error-free
          operation. Maintenance or updates may affect accessibility. We are not liable for any loss or damage due to
          downtime or technical issues.
        </p>
      </section>

      <Separator className="my-10" />

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">8. Termination</h2>
        <p>
          We may suspend or terminate your access without notice if you violate these Terms, fail to make required
          payments, or misuse the Service. Upon termination, your access to forms, reports, and stored data may be
          disabled.
        </p>
      </section>

      <Separator className="my-10" />

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">9. Limitation of Liability</h2>
        <p>
          To the maximum extent permitted by law, Custovra shall not be liable for any indirect, incidental, or
          consequential damages arising from the use or inability to use the Service. Your sole remedy for dissatisfaction
          is to discontinue using the Service.
        </p>
      </section>

      <Separator className="my-10" />

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">10. Changes to Terms</h2>
        <p>
          We may update these Terms at any time. The latest version will always be available on our website. Continued
          use of Custovra after changes means you accept the updated Terms.
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
