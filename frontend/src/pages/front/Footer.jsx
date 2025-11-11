import { Mail } from "lucide-react";


export default function Footer() {
  return (
            <footer className="bg-[#252525] text-gray-200 py-12 px-6">
                <div className="max-w-6xl mx-auto grid sm:grid-cols-1 md:grid-cols-3 gap-8">
                    <div>
                        <h3 className="text-2xl font-bold text-white">Custovra</h3>
                        <p className="mt-3 text-gray-300">
                            Feedback platform that helps businesses collect, track, and grow through customer insights.
                        </p>
                    </div>
                    <div>
                        <h4 className="text-lg font-semibold text-white">Quick Links</h4>
                        <ul className="mt-3 space-y-2">
                            <li><a href="#pricing" className="hover:underline">Pricing</a></li>
                            <li><a href="#faq" className="hover:underline">FAQs</a></li>
                            <li><a href="#contact" className="hover:underline">Contact</a></li>
                            <li><a href="/terms-and-conditions" className="hover:underline">Terms and Conditions</a></li>
                            <li><a href="/privacy-policy" className="hover:underline">Privacy Policy</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-lg font-semibold text-white">Contact</h4>
                        <p className="mt-3 flex items-center gap-2">
                            <Mail className="text-[#16bf4c]" size={18} /> info@custovra.com
                        </p>
                    </div>
                </div>
                <div className="text-center mt-10 text-gray-400 text-sm">
                    © 2025 Custovra. All rights reserved.
                </div>
            </footer>
  )
}
