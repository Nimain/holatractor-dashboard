"use client";

import { Play } from "lucide-react"
import { useRouter } from 'next/navigation';

export default function MarketingDashboard() {
      const router = useRouter();

  return (
    <div className="  ">
      <div className=" ">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black mb-4">Hey Dealer ! Welcome to the Marketing Dashboard</h1>
          <h2 className="text-xl font-semibold text-red-600 mb-6">Set Up Free Whatsapp Business Account</h2>
        </div>

        {/* Main Content */}
        <div className="flex gap-6">
          {/* Left Main Card */}
          <div className="flex-1 bg-gradient-to-br from-[#A10A0C] to-[#7A0808] rounded-lg p-8 text-white">
            <div className="flex gap-8">
              {/* Left Side Content */}
              <div className="flex-1 space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-6">Apply for Whatsapp Business API</h3>

                  <div className="mb-6">
                    <h4 className="font-semibold mb-3">How to apply</h4>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="text-white mt-1">•</span>
                        <span className="text-sm leading-relaxed">
                          Click on Continue with Facebook to apply for the Whatsapp Business Api.
                        </span>
                      </li>
                    </ul>
                  </div>

                  <div className="mb-6">
                    <h4 className="font-semibold mb-3">Requirements to Apply</h4>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="text-white mt-1">•</span>
                        <span className="text-sm">A Registered Business</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-white mt-1">•</span>
                        <span className="text-sm">A working website</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-white mt-1">•</span>
                        <span className="text-sm">And a Whatsapp number</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-sm">Guide On how to Apply for Whatsapp Business API ?</h4>
                  </div>
                </div>
              </div>

              {/* Right Side - Video and Buttons */}
              <div className="w-80 space-y-4">
                <div className="bg-gray-300 rounded-lg h-48 flex items-center justify-center">
                  <div className="text-center">
                    <Play className="w-12 h-12 text-gray-700 mx-auto mb-2" />
                    <p className="text-gray-700 font-medium text-lg">Video</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <button className="w-full bg-white text-red-600 font-semibold py-3 px-6 rounded-lg hover:bg-gray-50 transition-colors">
                    Schedule Meetings
                  </button>

                  <button 
                    onClick={() => router.push('/dealer/marketing/home')}
                    className="w-full bg-white text-red-600 font-semibold py-3 px-6 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Continue with Facebook
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side Cards */}
          <div className="w-80 space-y-6">
            {/* Advertisement Credits Card */}
            <div className="bg-gradient-to-br from-[#A10A0C] to-[#7A0808] rounded-lg p-6 text-white text-center">
              <h3 className="text-lg font-semibold mb-6">Advertisement Credits</h3>
              <div className="text-6xl font-bold mb-6">₹0</div>
              <button className="w-full bg-white text-red-600 font-semibold py-3 px-6 rounded-lg hover:bg-gray-50 transition-colors">
                Buy Credits
              </button>
            </div>

            {/* WhatsApp Conversation Credits Card */}
            <div className="bg-gradient-to-br from-[#A10A0C] to-[#7A0808] rounded-lg p-6 text-white text-center">
              <h3 className="text-lg font-semibold mb-6">Whatsapp Conversation Credits Wcc</h3>
              <div className="text-6xl font-bold mb-6">₹50</div>
              <button className="w-full bg-white text-red-600 font-semibold py-3 px-6 rounded-lg hover:bg-gray-50 transition-colors">
                Buy More
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
