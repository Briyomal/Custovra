import { CheckCircle, Star, BarChart3, Users, MessageCircle, Shield, X, AlertTriangle, Check } from "lucide-react";
import Header from "./Header";
import LightRays from "@/components/LightRays";
import RotatingText from "@/components/RotatingText";
import { Button } from "@/components/ui/button";
import herobg from "../../assets/herobg.webp";
import { HeroVideoDialog } from "@/components/ui/hero-video-dialog"
import Footer from "./Footer";
import MagicBento from '@/components/MagicBento'
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const rows = [
    {
        feature: "Designed for Customer Feedback",
        gform: (
            <span className="flex items-center gap-2 text-red-500">
                <X className="w-4 h-4" />
                <span className="text-white">No</span>
            </span>
        ),
        custovra: (
            <span className="flex items-center gap-2 text-green-500">
                <Check className="w-4 h-4" />
                <span>Yes</span>
            </span>
        ),
    },
    {
        feature: "QR Code Printing",
        gform: (
            <span className="flex items-center gap-2 text-yellow-500">
                <AlertTriangle className="w-4 h-4" />
                <span>Manual</span>
            </span>
        ),
        custovra: (
            <span className="flex items-center gap-2 text-green-500">
                <Check className="w-4 h-4" />
                <span>Auto-generated</span>
            </span>
        ),
    },
    {
        feature: "Employee Rating System",
        gform: (
            <span className="flex items-center gap-2 text-red-500">
                <X className="w-4 h-4" />
                <span>No</span>
            </span>
        ),
        custovra: (
            <span className="flex items-center gap-2 text-green-500">
                <Check className="w-4 h-4" />
                <span>Built-in</span>
            </span>
        ),
    },
    {
        feature: "Real-Time Reports",
        gform: (
            <span className="flex items-center gap-2 text-yellow-500">
                <AlertTriangle className="w-4 h-4" />
                <span>Basic</span>
            </span>
        ),
        custovra: (
            <span className="flex items-center gap-2 text-green-500">
                <Check className="w-4 h-4" />
                <span>Advanced Analytics</span>
            </span>
        ),
    },
    {
        feature: "Custom Branding",
        gform: (
            <span className="flex items-center gap-2 text-yellow-500">
                <AlertTriangle className="w-4 h-4" />
                <span>Limited</span>
            </span>
        ),
        custovra: (
            <span className="flex items-center gap-2 text-green-500">
                <Check className="w-4 h-4" />
                <span>Full Control</span>
            </span>
        ),
    },
    {
        feature: "Feedback Dashboard",
        gform: (
            <span className="flex items-center gap-2 text-red-500">
                <X className="w-4 h-4" />
                <span>No</span>
            </span>
        ),
        custovra: (
            <span className="flex items-center gap-2 text-green-500">
                <Check className="w-4 h-4" />
                <span>Centralized Insights</span>
            </span>
        ),
    },
];
const HomePage = () => {
    const [availablePlans, setAvailablePlans] = useState([]);
    const [loadingPlans, setLoadingPlans] = useState(true);
    const [billingPeriod, setBillingPeriod] = useState("monthly");

    // Fetch available subscription plans
    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/manual-billing/available-plans`);
                if (response.ok) {
                    const data = await response.json();
                    setAvailablePlans(data.data || []);
                }
            } catch (error) {
                console.error("Error fetching plans:", error);
            } finally {
                setLoadingPlans(false);
            }
        };

        fetchPlans();
    }, []);

    // Format currency (similar to customer billing page)
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-LK', {
            style: 'currency',
            currency: 'LKR',
            minimumFractionDigits: 2
        }).format(amount);
    };

    // Get price based on selected billing period
    const getPriceForPeriod = (plan) => {
        switch (billingPeriod) {
            case "monthly":
                return plan.final_prices?.monthly ?? plan.price_monthly;
            case "half_yearly":
                return plan.final_prices?.half_yearly ?? (plan.price_monthly * 6);
            case "yearly":
                return plan.final_prices?.yearly ?? plan.price_yearly;
            default:
                return plan.price_monthly;
        }
    };

    // Get original price based on selected billing period (before discount)
    const getOriginalPriceForPeriod = (plan) => {
        switch (billingPeriod) {
            case "monthly":
                return plan.price_monthly;
            case "half_yearly":
                return plan.price_monthly * 6;
            case "yearly":
                return plan.price_yearly;
            default:
                return plan.price_monthly;
        }
    };

    // Get equivalent monthly rate for longer periods
    const getEquivalentMonthlyRate = (plan) => {
        switch (billingPeriod) {
            case "half_yearly":
                return (plan.final_prices?.half_yearly ?? (plan.price_monthly * 6)) / 6;
            case "yearly":
                return (plan.final_prices?.yearly ?? plan.price_yearly) / 12;
            default:
                return null;
        }
    };

    // Get discount percentage for current period
    const getDiscountForPeriod = (plan) => {
        if (!plan || !plan.discounts) {
            return 0;
        }

        const discounts = plan.discounts;
        if (typeof discounts === 'object' && discounts !== null) {
            return discounts[billingPeriod] || 0;
        }

        return 0;
    };

    // Get period label
    const getPeriodLabel = () => {
        switch (billingPeriod) {
            case "monthly":
                return "/mo";
            case "half_yearly":
                return "/6mo";
            case "yearly":
                return "/yr";
            default:
                return "/mo";
        }
    };

    // Get savings amount for current period
    const getSavingsForPeriod = (plan) => {
        const discount = getDiscountForPeriod(plan);
        if (discount <= 0) return 0;

        let originalPrice;
        switch (billingPeriod) {
            case "monthly":
                originalPrice = plan.price_monthly;
                break;
            case "half_yearly":
                originalPrice = plan.price_monthly * 6;
                break;
            case "yearly":
                originalPrice = plan.price_yearly;
                break;
            default:
                originalPrice = plan.price_monthly;
        }

        const finalPrice = getPriceForPeriod(plan);
        return originalPrice - finalPrice;
    };

    return (
        <>
            <Header />

            {/* Hero Section */}
            <section id="home" className="relative overflow-hidden bg-white dark:bg-[#0D0D0D] h-screen flex items-center justify-center">
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
                <div className="relative z-10 mx-auto max-w-3xl text-center px-6 md:px-6 pt-20 sm:pt-32">
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
            <section className="hidden bg-gradient-to-b from-[rgba(255,255,255,0)] to-white dark:from-[rgba(13,13,13,0.23)] dark:to-[rgba(13,13,13,1)] mt-[-30%] md:mt-[-10%] flex items-center justify-center relative z-20 py-6 md:pt-0">
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
            <section id="how-it-works" className="bg-gray-50 dark:bg-[#0D0D0D] py-24 px-4 md:px-6">
                <div className="max-w-6xl mx-auto text-center">
                    <h2 className="text-3xl md:text-4xl font-bold leading-normal inline-block text-transparent bg-clip-text bg-gradient-to-r from-theme-green to-lime-500">Collect. Analyze. Grow.</h2>
                    <p className="mt-4 mb-4 text-md md:text-lg text-themebglight dark:text-white max-w-2xl mx-auto">
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
            <section id="features" className="bg-gradient-to-b from-gray-50 to-white dark:from-themebglight dark:to-black py-24 px-6">
                <div className="max-w-6xl mx-auto text-center">
                    <h2 className="text-3xl md:text-4xl font-bold leading-normal inline-block text-transparent bg-clip-text bg-gradient-to-r from-theme-green to-lime-500">Everything You Need to Understand Your Customers</h2>
                    <p className="mt-4 mb-4 text-md md:text-lg text-themebglight dark:text-white max-w-2xl mx-auto">
                        Custovra gives you all the tools to collect, manage, and act on customer feedback, all in one platform.
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
                                <Icon className="text-theme-green dark:text-theme-green mb-4" size={36} />
                                <h3 className="text-xl font-semibold text-themebglight dark:text-white">{title}</h3>
                                <p className="mt-2 text-gray-700 dark:text-gray-300">{desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Why Choose Custovra */}
            <section id="why-choose" className="bg-white dark:bg-black py-24 px-6">
                <div className="max-w-5xl mx-auto text-center">
                    <h2 className="text-3xl md:text-4xl font-bold leading-normal inline-block text-transparent bg-clip-text bg-gradient-to-r from-theme-green to-lime-500">Why Businesses Choose Custovra</h2>
                    <p className="mt-4 text-md md:text-lg text-themebglight dark:text-white max-w-2xl mx-auto">
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
                    <h2 className="text-3xl md:text-4xl font-bold leading-normal inline-block text-transparent bg-clip-text bg-gradient-to-r from-theme-green to-lime-500">Why Choose Custovra Over Google Forms</h2>
                    <p className="mt-4 text-md md:text-lg text-themebglight dark:text-white max-w-2xl mx-auto">
                        Google Forms is great for simple surveys, but Custovra is built specifically for business feedback, employee reviews, and insights.
                    </p>
                    <div className="overflow-x-auto mt-10 rounded-lg overflow-hidden border border-gray-200 dark:border-green-950">
                        <table className="w-full border border-gray-200 dark:border-green-950 text-left">
                            <thead className="bg-gray-100 dark:bg-themebglight text-themebglight dark:text-gray-300 rounded-lg">
                                <tr>
                                    <th className="p-4">Feature</th>
                                    <th className="p-4">Google Forms</th>
                                    <th className="p-4 text-theme-green">Custovra</th>
                                </tr>
                            </thead>
                            <tbody className="text-themebglight dark:text-white">
                                {rows.map((row, i) => (
                                    <tr
                                        key={i}
                                        className="border-t border-gray-200 dark:border-green-950"
                                    >
                                        <td className="p-4">{row.feature}</td>
                                        <td className="p-4">{row.gform}</td>
                                        <td className="p-4 font-semibold text-theme-green">
                                            {row.custovra}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>

                        </table>
                    </div>
                </div>
            </section>

            {/* Pricing */}
            <section id="pricing" className="bg-white dark:bg-black py-24 px-6">
                <div className="max-w-6xl mx-auto text-center">
                    <h2 className="text-3xl md:text-4xl font-bold leading-normal inline-block text-transparent bg-clip-text bg-gradient-to-r from-theme-green to-lime-500">Pricing</h2>
                    <p className="mt-4 text-md md:text-lg text-themebglight dark:text-white max-w-2xl mx-auto">
                        Custovra offers a range of pricing plans for businesses of all sizes. Our pricing is based on the number of users and the amount of storage you need.
                    </p>

                    {/* Billing Period Toggle */}
                    <div className="flex items-center justify-center space-x-2 p-4 rounded-lg mt-8">
                        <button
                            className={`px-4 py-2 rounded-l-lg ${billingPeriod === "monthly" ? "bg-[#16bf4c] text-themebglight font-medium" : "bg-gray-200 dark:bg-gray-800"}`}
                            onClick={() => setBillingPeriod("monthly")}
                        >
                            Monthly
                        </button>
                        <button
                            className={`${billingPeriod === "half_yearly" ? "bg-[#16bf4c] text-themebglight font-medium" : "bg-gray-200 dark:bg-gray-800"} px-4 py-2`}
                            onClick={() => setBillingPeriod("half_yearly")}
                        >
                            Half-Yearly
                        </button>
                        <button
                            className={`px-4 py-2 rounded-r-lg ${billingPeriod === "yearly" ? "bg-[#16bf4c] text-themebglight font-medium" : "bg-gray-200 dark:bg-gray-800"}`}
                            onClick={() => setBillingPeriod("yearly")}
                        >
                            Yearly
                        </button>
                    </div>

                    {loadingPlans ? (
                        <div className="mt-12 text-center">
                            <p className="text-themebglight dark:text-white">Loading plans...</p>
                        </div>
                    ) : availablePlans.length > 0 ? (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-6">
                            {availablePlans.map((plan) => {
                                const price = getPriceForPeriod(plan);
                                const originalPrice = getOriginalPriceForPeriod(plan);
                                const equivalentMonthly = getEquivalentMonthlyRate(plan);
                                const discount = getDiscountForPeriod(plan);
                                const savings = getSavingsForPeriod(plan);

                                // Check if there's a discount to show original price with strikethrough
                                const hasDiscount = discount > 0 && originalPrice !== price;

                                return (
                                    <Card key={plan.id} className="flex flex-col relative">
                                        {/* Discount Badge at the top */}
                                        {discount > 0 && (
                                            <div className="absolute -top-5 left-1/2 transform -translate-x-1/2">
                                                <Badge className="bg-gradient-to-r from-[#16bf4c] to-lime-500 text-themebglight px-4 py-2 text-lg font-bold shadow-lg whitespace-nowrap gap-1">
                                                    {discount}% OFF
                                                    {savings > 0 && (
                                                        <span className="block text-xs font-normal mt-1">
                                                            Save {formatCurrency(savings)}
                                                        </span>
                                                    )}
                                                </Badge>
                                            </div>
                                        )}

                                        <CardHeader className="pt-12">
                                            <CardTitle>{plan.name}</CardTitle>
                                            <CardDescription>{plan.description}</CardDescription>
                                        </CardHeader>
                                        <CardContent className="flex-1">
                                            <div className="space-y-4">
                                                <div className="text-3xl font-bold">
                                                    {hasDiscount && (
                                                        <div className="flex flex-col items-baseline gap-2">
                                                            <span className="text-2xl text-gray-500 line-through">
                                                                {formatCurrency(originalPrice)}
                                                            </span>
                                                            <span className="text-lime-500">
                                                                {formatCurrency(price)}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {!hasDiscount && (
                                                        <span>
                                                            {formatCurrency(price)}
                                                        </span>
                                                    )}
                                                    <span className="text-lg font-normal text-gray-500">
                                                        {getPeriodLabel()}
                                                    </span>
                                                </div>
                                                {equivalentMonthly && (
                                                    <div className="text-sm text-gray-500">
                                                        Equivalent to {formatCurrency(equivalentMonthly)}/month
                                                    </div>
                                                )}

                                                <ul className="space-y-2">
                                                    <li className="flex items-center">
                                                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                                                        {plan.form_limit} forms
                                                    </li>
                                                    <li className="flex items-center">
                                                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                                                        {plan.submission_limit} submissions/month
                                                    </li>
                                                    {plan.features && (
                                                        <>
                                                            <li className={`flex items-center ${plan.features.image_upload ? '' : 'opacity-50 line-through'}`}>
                                                                {plan.features.image_upload ? (
                                                                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                                                                ) : (
                                                                    <X className="h-4 w-4 text-red-500 mr-2" />
                                                                )}
                                                                Image Upload
                                                            </li>
                                                            <li className={`flex items-center ${plan.features.employee_management ? '' : 'opacity-50 line-through'}`}>
                                                                {plan.features.employee_management ? (
                                                                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                                                                ) : (
                                                                    <X className="h-4 w-4 text-red-500 mr-2" />
                                                                )}
                                                                Employee Management
                                                            </li>
                                                            {plan.features.custom_features && plan.features.custom_features.map((feature, index) => (
                                                                <li key={index} className="flex items-center">
                                                                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                                                                    {feature}
                                                                </li>
                                                            ))}
                                                        </>
                                                    )}
                                                </ul>
                                            </div>
                                        </CardContent>
                                        <div className="p-6 pt-0">
                                            <Button
                                                className="w-full rounded-md font-semibold text-black border
                                                  border-lime-500
                                                    bg-gradient-to-r from-[#16bf4c] to-lime-500
                                                    transition-all duration-700 ease-in-out 
                                                    hover:shadow-[0_0_15px_rgba(22,191,76,0.4)] 
                                                    focus:outline-none focus:ring-2 focus:ring-lime-400"
                                                onClick={() => window.location.href = '/billing'}
                                            >
                                                Subscribe Now
                                            </Button>
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="mt-12 text-center">
                            <p className="text-themebglight dark:text-white">No subscription plans available at the moment.</p>
                        </div>
                    )}
                </div>
            </section>

            {/* FAQs */}
            <section id="faq" className="bg-gray-50 dark:bg-[#0D0D0D] py-24 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl md:text-4xl font-bold leading-normal inline-block text-transparent bg-clip-text bg-gradient-to-r from-theme-green to-lime-500">Frequently Asked Questions</h2>
                    <div className="mt-10 space-y-6 text-themebglight dark:text-white text-left">
                        {[
                            ["Can I customize my forms?", "Absolutely! Add your brand logo, colors, and questions easily."],
                            ["Do I need technical skills?", "No. Custovra is beginner-friendly and simple to use."],
                            ["How do customers access my form?", "Each form has a unique link and QR code for easy sharing."],
                            ["Can I assign employees to forms?", "Yes, customers can rate specific employees through forms."],
                            ["Is my data secure?", "Yes. We use encryption and secure storage to protect all data."],
                        ].map(([q, a], i) => (
                            <div key={i} className="border border-gray-200 dark:border-white/20 rounded-lg p-5">
                                <h3 className="text-lg font-semibold text-themebglight dark:text-theme-green">{q}</h3>
                                <p className="mt-2 text-themebglight dark:text-white">{a}</p>
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
