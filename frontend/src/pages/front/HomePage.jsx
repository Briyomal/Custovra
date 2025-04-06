import Header from "./Header";

//import { useState } from 'react'
//import { Dialog, DialogPanel } from '@headlessui/react'
//import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
/*
const navigation = [
	{ name: 'Product', href: '#' },
	{ name: 'Features', href: '#' },
	{ name: 'Marketplace', href: '#' },
	{ name: 'Company', href: '#' },
  ]
*/
const HomePage = () => {
	//const [setMobileMenuOpen] = useState(false)
	return (
		<>
			<Header />
			<div className="bg-white dark:bg-slate-950">
				<div className="relative isolate px-6 pt-14 lg:px-8">
					<div aria-hidden="true" className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
						<div
							style={{
								clipPath: "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
							}}
							className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
						/>
					</div>

					<div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
						<div className="text-center">
							<h1 className="text-balance text-5xl font-semibold tracking-tight text-gray-900 sm:text-7xl dark:text-gray-50">Welcome to Review Platform</h1>
							<p className="mt-8 text-pretty text-lg font-medium text-gray-500 sm:text-xl/8 dark:text-gray-400">Anim aute id magna aliqua ad ad non deserunt sunt. Qui irure qui lorem cupidatat commodo. Elit sunt amet fugiat veniam occaecat.</p>
							<div className="mt-10 flex items-center justify-center gap-x-6">
								<a href="#" className="py-3 px-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg shadow-lg hover:from-blue-700 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-blue-200 transition duration-200">
									Get started
								</a>
								<a href="#" className="text-sm/6 font-semibold text-gray-900 dark:text-white">
									Learn more <span aria-hidden="true">→</span>
								</a>
							</div>
						</div>
					</div>
					<div aria-hidden="true" className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]">
						<div
							style={{
								clipPath: "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
							}}
							className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"
						/>
					</div>
				</div>
			</div>
			{/* About Us Section */}
			<section id="about" className="bg-gray-50 dark:bg-slate-900 py-24 px-6 lg:px-8">
				<div className="max-w-3xl mx-auto text-center">
					<h2 className="text-4xl font-semibold text-gray-900 dark:text-white">About Us</h2>
					<p className="mt-6 text-lg text-gray-600 dark:text-gray-400">
						We are a platform dedicated to helping businesses collect and manage customer reviews and complaints with ease.
						Empower your brand with authentic feedback, smart insights, and a simple interface that scales with your needs.
					</p>
				</div>
			</section>

			{/* Pricing Section */}
			<section id="pricing" className="bg-white dark:bg-slate-950 py-24 px-6 lg:px-8">
				<div className="max-w-5xl mx-auto text-center">
					<h2 className="text-4xl font-semibold text-gray-900 dark:text-white">Pricing Plans</h2>
					<p className="mt-4 text-lg text-gray-600 dark:text-gray-400">Choose the plan that fits your business size and needs.</p>
					<div className="mt-12 grid gap-8 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
						{/* Basic Plan */}
						<div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-md">
							<h3 className="text-xl font-bold text-gray-900 dark:text-white">Basic</h3>
							<p className="mt-2 text-sm text-gray-500 dark:text-gray-400">For small businesses getting started.</p>
							<p className="mt-4 text-3xl font-bold text-indigo-600">$15<span className="text-base font-medium text-gray-500">/mo</span></p>
							<ul className="mt-6 space-y-2 text-sm text-gray-600 dark:text-gray-300 text-left">
								<li>✔️ Up to 5 forms</li>
								<li>✔️ Basic reporting</li>
								<li>✔️ QR code generator</li>
							</ul>
							<a href="#" className="mt-6 inline-block w-full rounded-lg bg-indigo-600 py-3 text-white font-semibold hover:bg-indigo-700 transition duration-200">Choose Plan</a>
						</div>

						{/* Standard Plan */}
						<div className="rounded-2xl border border-indigo-600 bg-indigo-50 dark:bg-slate-800 p-8 shadow-xl">
							<h3 className="text-xl font-bold text-gray-900 dark:text-white">Standard</h3>
							<p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Perfect for growing teams.</p>
							<p className="mt-4 text-3xl font-bold text-indigo-600">$30<span className="text-base font-medium text-gray-500">/mo</span></p>
							<ul className="mt-6 space-y-2 text-sm text-gray-700 dark:text-gray-300 text-left">
								<li>✔️ Up to 10 forms</li>
								<li>✔️ Advanced analytics</li>
								<li>✔️ Custom branding</li>
							</ul>
							<a href="#" className="mt-6 inline-block w-full rounded-lg bg-indigo-600 py-3 text-white font-semibold hover:bg-indigo-700 transition duration-200">Choose Plan</a>
						</div>

						{/* Premium Plan */}
						<div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-md">
							<h3 className="text-xl font-bold text-gray-900 dark:text-white">Premium</h3>
							<p className="mt-2 text-sm text-gray-500 dark:text-gray-400">For larger businesses or enterprises.</p>
							<p className="mt-4 text-3xl font-bold text-indigo-600">$60<span className="text-base font-medium text-gray-500">/mo</span></p>
							<ul className="mt-6 space-y-2 text-sm text-gray-600 dark:text-gray-300 text-left">
								<li>✔️ Up to 20 forms</li>
								<li>✔️ Employee assignment</li>
								<li>✔️ Priority support</li>
							</ul>
							<a href="#" className="mt-6 inline-block w-full rounded-lg bg-indigo-600 py-3 text-white font-semibold hover:bg-indigo-700 transition duration-200">Choose Plan</a>
						</div>
					</div>
				</div>
			</section>

			{/* Contact Section */}
			<section id="contact" className="bg-gray-50 dark:bg-slate-900 py-24 px-6 lg:px-8">
				<div className="max-w-2xl mx-auto text-center">
					<h2 className="text-4xl font-semibold text-gray-900 dark:text-white">Contact Us</h2>
					<p className="mt-4 text-lg text-gray-600 dark:text-gray-400">Have questions or need help? Fill out the form below and we’ll get back to you shortly.</p>
					<form className="mt-10 space-y-6 text-left">
						<div>
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
							<input type="text" className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-slate-800 px-4 py-2 text-gray-900 dark:text-white focus:ring-indigo-500 focus:border-indigo-500" />
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
							<input type="email" className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-slate-800 px-4 py-2 text-gray-900 dark:text-white focus:ring-indigo-500 focus:border-indigo-500" />
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Message</label>
							<textarea rows="4" className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-slate-800 px-4 py-2 text-gray-900 dark:text-white focus:ring-indigo-500 focus:border-indigo-500"></textarea>
						</div>
						<div className="text-center">
							<button type="submit" className="rounded-lg bg-indigo-600 px-6 py-3 text-white font-semibold hover:bg-indigo-700 transition duration-200">Send Message</button>
						</div>
					</form>
				</div>
			</section>

		</>
	);
};

export default HomePage;
