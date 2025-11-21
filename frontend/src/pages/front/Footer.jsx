import { Mail, Phone, ArrowRightCircle, FileText, HelpCircle, CircleDollarSign, MessageSquare } from "lucide-react";
import logoWhite from "../../assets/logo-white.png";

export default function Footer() {

  return (
    <footer className="bg-gradient-to-b from-[#171717] to-[#0D0D0D] text-gray-200 py-12 px-6">
      <div className="max-w-6xl mx-auto grid sm:grid-cols-1 md:grid-cols-4 gap-10">

        {/* Brand */}
        <div>
          <img
            src={logoWhite}
            alt="Custovra Logo"
            className="h-12 mb-4"
          />
          <p className="mt-6 text-gray-300">
            Feedback platform that helps businesses collect, track, and grow through customer insights.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-lg font-semibold text-theme-green">Quick Links</h4>
          <ul className="mt-4 space-y-3">
            <li>
              <a href="#pricing" className="flex items-center gap-2 hover:text-lime-500 transition">
                <CircleDollarSign size={16} /> Pricing
              </a>
            </li>
            <li>
              <a href="#faq" className="flex items-center gap-2 hover:text-lime-500 transition">
                <HelpCircle size={16} /> FAQs
              </a>
            </li>
            <li>
              <a href="#contact" className="flex items-center gap-2 hover:text-lime-500 transition">
                <MessageSquare size={16} /> Contact
              </a>
            </li>
            <li>
              <a href="/terms-and-conditions" className="flex items-center gap-2 hover:text-lime-500 transition">
                <FileText size={16} /> Terms & Conditions
              </a>
            </li>
            <li>
              <a href="/privacy-policy" className="flex items-center gap-2 hover:text-lime-500 transition">
                <ArrowRightCircle size={16} /> Privacy Policy
              </a>
            </li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 className="text-lg font-semibold text-theme-green">Contact</h4>
          <div className="mt-4 space-y-4">
            <p className="flex items-center gap-2 hover:text-lime-500 transition">
              <Mail className="text-theme-green" size={18} />
              <a href="mailto:info@custovra.com">info@custovra.com</a>
            </p>
            <p className="flex items-center gap-2 hover:text-lime-500 transition">
              <Phone className="text-theme-green" size={18} />
              <a href="tel:0775740755">0775740755</a>
            </p>
          </div>
        </div>

        {/* Optional: Extra Column (e.g. Social Media or Newsletter) */}
        <div>
          <h4 className="text-lg font-semibold text-theme-green">Stay Updated</h4>
          <p className="mt-4 text-gray-300">
            Subscribe to our newsletter to stay updated with new features.
          </p>
          <form className="mt-4 flex">
            <input
              type="email"
              placeholder="Email"
              className="w-full px-3 py-2 bg-[#1F1F1F] border border-gray-700 rounded-l-md focus:outline-none"
            />
            <button className="bg-theme-green px-4 rounded-r-md text-black font-semibold">
              Join
            </button>
          </form>
        </div>

      </div>

      <div className="text-center mt-10 text-gray-400 text-sm border-t border-theme-green/30 pt-4"></div>
      <div className="text-center mt-4 text-white text-sm">
        © 2025 Custovra. All rights reserved.
      </div>
    </footer>
  );
}
