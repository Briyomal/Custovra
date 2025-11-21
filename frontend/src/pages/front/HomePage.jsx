import { CheckCircle, Star, BarChart3, Users, MessageCircle, Shield } from "lucide-react";
import Header from "./Header";
import LightRays from "@/components/LightRays";
import RotatingText from "@/components/RotatingText";
import { Button } from "@/components/ui/button";
import herobg from "../../assets/herobg.webp";
import { HeroVideoDialog } from "@/components/ui/hero-video-dialog"
import Footer from "./Footer";
import MagicBento from '@/components/MagicBento'

const HomePage = () => {
    return (
        <>
            <Header />

            {/* Hero Section */}
            <section className="relative overflow-hidden bg-white dark:bg-[#0D0D0D] h-screen flex items-center justify-center">
                {/* Background Image */}
                <img src={herobg} alt="Hero Background" className="absolute inset-0 object-cover w-full h-full z-0" />

                {/* Light Rays Background */}
                <div className="absolute inset-0 h-full w-full z-1" aria-hidden="true">
                    <LightRays
                        raysOrigin="top-center"
                        raysColor="#70ff9e"
                        raysSpeed={1.5}
                        lightSpread={1}
                        rayLength={1.5}
                        followMouse={true}
                        mouseInfluence={0.1}
                        noiseAmount={0.1}
                        distortion={0.05}
                        className="custom-rays"
                    />
                </div>

                {/* Content */}
                <div className="relative z-10 mx-auto max-w-3xl text-center px-6 pt-20 sm:pt-32">
                    <h1 className="text-3xl md:text-5xl font-bold text-white dark:text-white sm:text-6xl">
                        Turn Customer Feedback Into{" "}
                        <span className="inline-block text-theme-green">
                            <RotatingText
                                texts={[
                                    "Business Growth",
                                    "Increased Revenue",
                                    "Smarter Decisions",
                                ]}
                                mainClassName="overflow-hidden inline-block"
                                staggerFrom="last"
                                initial={{ y: "100%" }}
                                animate={{ y: 0 }}
                                exit={{ y: "-120%" }}
                                staggerDuration={0.025}
                                splitLevelClassName="overflow-hidden pb-0.5 sm:pb-1 md:pb-1"
                                transition={{ type: "spring", damping: 30, stiffness: 400 }}
                                rotationInterval={3000}
                            />
                        </span>
                    </h1>

                    <p className="mt-6 text-lg text-gray-300 dark:text-gray-300">
                        Create powerful review and complaint forms, share them through QR codes or links, and start collecting real
                        feedback that helps your business grow.
                    </p>

                    <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                        {/* Primary Gradient Button */}
                        <Button
                            asChild
                            className="group relative text-base px-8 py-5 rounded-md font-semibold text-black border
             border-lime-500
               bg-gradient-to-r from-theme-green to-lime-500
               transition-all duration-700 ease-in-out 
               hover:shadow-[0_0_15px_rgba(22,191,76,0.4)] 
               focus:outline-none focus:ring-2 focus:ring-lime-400"
                        >
                            <a href="#" className="flex items-center justify-center gap-2">
                                Register Now
                                <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                            </a>
                        </Button>

                        {/* Secondary Outline Button */}
                        <Button
                            asChild
                            className="group relative text-base px-8 py-5 rounded-md font-semibold border 
               											border-theme-green text-theme-green dark:text-white bg-transparent 
               											hover:!text-[#000000] hover:border-lime-500 hover:bg-lime-500
               											transition-all duration-200 ease-in-out 
               											hover:shadow-[0_0_15px_rgba(22,191,76,0.4)] 
               											focus:outline-none focus:ring-2 focus:ring-lime-500"
                        >
                            <a href="#" className="flex items-center justify-center gap-2">
                                See How It Works
                                <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                            </a>
                        </Button>
                    </div>

                </div>
            </section>
            <section className="bg-gradient-to-b from-[rgba(255,255,255,0)] to-white dark:from-[rgba(13,13,13,0.23)] dark:to-[rgba(13,13,13,1)] mt-[-30%] md:mt-[-10%] flex items-center justify-center relative z-20 py-6 md:pt-0">
                <div className="container mx-auto max-w-6xl px-6 relative ">
                    <HeroVideoDialog
                        className="block dark:hidden"
                        animationStyle="top-in-bottom-out"
                        videoSrc="https://www.youtube.com/embed/qh3NGpYRG3I?si=4rb-zSdDkVK9qxxb"
                        thumbnailSrc="https://startup-template-sage.vercel.app/hero-light.png"
                        thumbnailAlt="Hero Video"
                    />
                    <HeroVideoDialog
                        className="hidden dark:block rounded-2xl border border-theme-green"
                        animationStyle="top-in-bottom-out"
                        videoSrc="https://www.youtube.com/embed/qh3NGpYRG3I?si=4rb-zSdDkVK9qxxb"
                        thumbnailSrc="https://startup-template-sage.vercel.app/hero-dark.png"
                        thumbnailAlt="Hero Video"
                    />
                </div>
            </section>



            {/* How It Works */}
            <section className="bg-gray-50 dark:bg-[#0D0D0D] py-24 px-6">
                <div className="max-w-6xl mx-auto text-center">
                    <h2 className="text-4xl font-bold text-theme-green dark:text-theme-green">Collect. Analyze. Grow.</h2>
                    <p className="mt-4 mb-4 text-lg text-themebglight dark:text-white max-w-2xl mx-auto">
                        Custovra makes it effortless to listen to your customers and use their feedback to improve your business.
                    </p>
                    <MagicBento
                        textAutoHide={true}
                        enableStars={false}
                        enableSpotlight={true}
                        enableBorderGlow={true}
                        enableTilt={false}
                        enableMagnetism={false}
                        clickEffect={false}
                        spotlightRadius={300}
                        particleCount={12}
                        glowColor="22, 191, 76"
                    />
                </div>
            </section>

            {/* Core Features */}
            <section className="bg-gradient-to-b from-gray-50 to-white dark:from-themebglight dark:to-black py-24 px-6">
                <div className="max-w-6xl mx-auto text-center">
                    <h2 className="text-4xl font-bold text-theme-green dark:text-theme-green">Everything You Need to Understand Your Customers</h2>
                    <p className="mt-4 mb-4 text-lg text-themebglight dark:text-white max-w-2xl mx-auto">
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
                            <div key={title} className="p-6 rounded-lg border border-theme-green bg-gradient-to-r from-gray-50 to-gray-200 dark:from-gray-50/5 dark:to-themebg shadow-sm hover:shadow-md transition">
                                <Icon className="text-theme-green dark:text-white mb-4" size={36} />
                                <h3 className="text-xl font-semibold text-themebglight dark:text-theme-green">{title}</h3>
                                <p className="mt-2 text-themebglight dark:text-white">{desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Why Choose Custovra */}
            <section className="bg-white dark:bg-black py-24 px-6">
                <div className="max-w-5xl mx-auto text-center">
                    <h2 className="text-4xl font-bold text-[#4f595b] dark:text-white">Why Businesses Choose Custovra</h2>
                    <p className="mt-4 text-lg text-themebglight dark:text-white max-w-2xl mx-auto">
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
                                <CheckCircle className="text-theme-green" />
                                <p className="text-gray-700 dark:text-gray-300 text-left">{text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Custovra vs Google Forms */}
            <section className="bg-gradient-to-b from-gray-50 to-white dark:from-themebglight dark:to-black  py-24 px-6">
                <div className="max-w-6xl mx-auto text-center">
                    <h2 className="text-4xl font-bold text-theme-green dark:text-theme-green">Why Choose Custovra Over Google Forms</h2>
                    <p className="mt-4 text-lg text-themebglight dark:text-white max-w-2xl mx-auto">
                        Google Forms is great for simple surveys, but Custovra is built specifically for business feedback, employee reviews, and insights.
                    </p>
                    <div className="overflow-x-auto mt-10">
                        <table className="w-full border border-gray-200 dark:border-themebg text-left">
                            <thead className="bg-gray-100 dark:bg-themebglight text-gray-700 dark:text-gray-300">
                                <tr>
                                    <th className="p-4">Feature</th>
                                    <th className="p-4">Google Forms</th>
                                    <th className="p-4 text-theme-green">Custovra</th>
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
                                        <td className="p-4 font-semibold text-theme-green">{custovra}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* FAQs */}
            <section className="bg-gray-50 dark:bg-[#0D0D0D] py-24 px-6">
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
            <Footer />
        </>
    );
};

export default HomePage;
