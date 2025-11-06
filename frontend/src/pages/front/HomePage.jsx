import { CheckCircle, Star, BarChart3, Users, MessageCircle, Shield, Mail } from "lucide-react";
import Header from "./Header";

const HomePage = () => {
  return (
    <>
      <Header />

      {/* Hero Section */}
			<section className="relative overflow-hidden bg-white dark:bg-slate-950">
				<div
					className="absolute inset-0 bg-gradient-to-br from-[#16bf4c]/20 to-[#4f595b]/10 opacity-40 blur-3xl"
					aria-hidden="true"
				></div>

				<div className="relative mx-auto max-w-3xl text-center px-6 pt-32 pb-40 sm:pt-48 sm:pb-56 lg:pt-56">
					<h1 className="text-5xl font-bold text-[#4f595b] dark:text-white sm:text-6xl">
						Turn Customer Feedback Into Business Growth
					</h1>
					<p className="mt-6 text-lg text-gray-600 dark:text-gray-400">
						Create powerful review and complaint forms, share them through QR codes or links, and start collecting real
						feedback that helps your business grow.
					</p>
					<div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
						<a
							href="#"
							className="px-6 py-3 rounded-lg bg-[#16bf4c] text-white font-semibold shadow-md hover:bg-[#13a843] transition"
						>
							Start Free Trial
						</a>
						<a href="#about" className="px-6 py-3 rounded-lg font-semibold text-[#4f595b] dark:text-gray-100">
							See How It Works →
						</a>
					</div>
				</div>
			</section>

      {/* How It Works */}
      <section className="bg-gray-50 dark:bg-slate-900 py-24 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-[#4f595b] dark:text-white">Collect. Analyze. Grow.</h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Custovra makes it effortless to listen to your customers and use their feedback to improve your business.
          </p>

          <div className="mt-12 grid sm:grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-md">
              <MessageCircle className="mx-auto text-[#16bf4c]" size={48} />
              <h3 className="mt-4 text-xl font-semibold text-[#4f595b] dark:text-white">1. Create Your Form</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Choose review or complaint forms, customize questions, and add your branding in minutes.
              </p>
            </div>
            <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-md">
              <Users className="mx-auto text-[#16bf4c]" size={48} />
              <h3 className="mt-4 text-xl font-semibold text-[#4f595b] dark:text-white">2. Share Easily</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Generate QR codes or shareable links to collect instant feedback from your customers.
              </p>
            </div>
            <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-md">
              <BarChart3 className="mx-auto text-[#16bf4c]" size={48} />
              <h3 className="mt-4 text-xl font-semibold text-[#4f595b] dark:text-white">3. Get Insights</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Analyze feedback, download reports, and track satisfaction trends effortlessly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section className="bg-white dark:bg-slate-950 py-24 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-[#4f595b] dark:text-white">Everything You Need to Understand Your Customers</h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Custovra gives you all the tools to collect, manage, and act on customer feedback — all in one platform.
          </p>

          <div className="mt-12 grid sm:grid-cols-1 md:grid-cols-3 gap-8 text-left">
            {[
              { icon: CheckCircle, title: "QR Code & Link Sharing", desc: "Gather feedback effortlessly in-store or online." },
              { icon: Star, title: "Review & Complaint Forms", desc: "Capture both praise and complaints effectively." },
              { icon: Users, title: "Employee Ratings", desc: "Let customers review individual employees." },
              { icon: BarChart3, title: "Smart Reports", desc: "Visualize trends and satisfaction data clearly." },
              { icon: Shield, title: "Data Security", desc: "Your feedback and business data are always protected." },
              { icon: MessageCircle, title: "Instant Notifications", desc: "Get alerts the moment new feedback arrives." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="p-6 bg-gray-50 dark:bg-slate-900 rounded-2xl shadow-sm hover:shadow-md transition">
                <Icon className="text-[#16bf4c] mb-4" size={36} />
                <h3 className="text-xl font-semibold text-[#4f595b] dark:text-white">{title}</h3>
                <p className="mt-2 text-gray-600 dark:text-gray-400">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Custovra */}
      <section className="bg-[#f9fff9] dark:bg-slate-900 py-24 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-[#4f595b] dark:text-white">Why Businesses Choose Custovra</h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Every successful business listens to its customers. Custovra helps you collect, understand, and respond to feedback so you can make smarter decisions and deliver exceptional experiences.
          </p>
          <div className="mt-10 grid sm:grid-cols-2 md:grid-cols-3 gap-8">
            {[
              "Get insights that drive business decisions",
              "Measure satisfaction and service performance",
              "Save hours with automation",
              "Build stronger customer relationships",
              "Reward top-performing employees",
              "Turn every response into an opportunity",
            ].map((text, i) => (
              <div key={i} className="flex items-start gap-3">
                <CheckCircle className="text-[#16bf4c]" />
                <p className="text-gray-700 dark:text-gray-300 text-left">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Custovra vs Google Forms */}
      <section className="bg-white dark:bg-slate-950 py-24 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-[#4f595b] dark:text-white">Why Choose Custovra Over Google Forms</h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
            Google Forms is great for simple surveys — but Custovra is built specifically for business feedback, employee reviews, and insights.
          </p>
          <div className="overflow-x-auto mt-10">
            <table className="w-full border border-gray-200 dark:border-gray-800 text-left">
              <thead className="bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300">
                <tr>
                  <th className="p-4">Feature</th>
                  <th className="p-4">Google Forms</th>
                  <th className="p-4 text-[#16bf4c]">Custovra</th>
                </tr>
              </thead>
              <tbody className="text-gray-600 dark:text-gray-400">
                {[
                  ["Designed for Customer Feedback", "❌", "✅"],
                  ["QR Code Printing", "⚠️ Manual", "✅ Auto-generated"],
                  ["Employee Rating System", "❌", "✅ Built-in"],
                  ["Real-Time Reports", "⚠️ Basic", "✅ Advanced Analytics"],
                  ["Custom Branding", "⚠️ Limited", "✅ Full Control"],
                  ["Feedback Dashboard", "❌", "✅ Centralized Insights"],
                ].map(([feature, gform, custovra], i) => (
                  <tr key={i} className="border-t border-gray-200 dark:border-gray-800">
                    <td className="p-4">{feature}</td>
                    <td className="p-4">{gform}</td>
                    <td className="p-4 font-semibold text-[#16bf4c]">{custovra}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="bg-gray-50 dark:bg-slate-900 py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-[#4f595b] dark:text-white">Frequently Asked Questions</h2>
          <div className="mt-10 space-y-6">
            {[
              ["Is Custovra free to try?", "Yes, you can start with a free trial and explore all key features."],
              ["Can I customize my forms?", "Absolutely! Add your brand logo, colors, and questions easily."],
              ["Do I need technical skills?", "No. Custovra is beginner-friendly and simple to use."],
              ["How do customers access my form?", "Each form has a unique link and QR code for easy sharing."],
              ["Can I assign employees to forms?", "Yes, customers can rate specific employees through forms."],
              ["Is my data secure?", "Yes. We use encryption and secure storage to protect all data."],
            ].map(([q, a], i) => (
              <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-lg p-5">
                <h3 className="text-lg font-semibold text-[#4f595b] dark:text-white">{q}</h3>
                <p className="mt-2 text-gray-600 dark:text-gray-400">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#4f595b] text-gray-200 py-12 px-6">
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
    </>
  );
};

export default HomePage;
