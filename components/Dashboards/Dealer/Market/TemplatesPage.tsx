"use client"
import { useState } from "react"
import CreateTemplateModal from "./CreateTemplateModal" // Corrected import path

const TemplatesPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const existingTemplates = [
    { id: 1, title: "Ecommerce Templates" },
    { id: 2, title: "Ecommerce Templates" },
    { id: 3, title: "Ecommerce Templates" },
  ]
  const userTemplates = [
    { id: 1, title: "Template 1" },
    { id: 2, title: "Template 2" },
    { id: 3, title: "Template 3" },
  ]
  return (
    <div className="w-full mx-auto p-3 bg-gray-100 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-red-600 mb-2">Templates</h1>
      </div>
      {/* Choose from existing Templates */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-red-600 mb-6">Choose from existing Templates</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {existingTemplates.map((template) => (
            <div key={template.id} className="bg-red-800 rounded-lg p-4 shadow-lg">
              <div className="bg-gray-200 rounded-lg h-32 flex items-center justify-center mb-4">
                <span className="text-gray-600 font-medium">Preview</span>
              </div>
              <h3 className="text-white font-medium mb-4">{template.title}</h3>
              <button className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded font-medium transition-colors">
                View All Templates
              </button>
            </div>
          ))}
        </div>
      </div>
      {/* Your Templates */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-red-600 mb-6">Your Templates</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {userTemplates.map((template) => (
            <div key={template.id} className="bg-red-800 rounded-lg p-4 shadow-lg">
              <div className="bg-gray-200 rounded-lg h-32 flex items-center justify-center mb-4">
                <span className="text-gray-600 font-medium">Preview</span>
              </div>
              <h3 className="text-white font-medium mb-4">{template.title}</h3>
              <button className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded font-medium transition-colors">
                Use Template
              </button>
            </div>
          ))}
        </div>
      </div>
      {/* Create your own Templates */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-red-600 mb-6">Create your own Templates</h2>
        <div className="bg-red-800 rounded-lg p-6 text-white">
          <h3 className="text-xl font-bold mb-4">Build your own Templates</h3>
          <div className="space-y-3 mb-6">
            <div className="flex items-start">
              <span className="w-2 h-2 bg-white rounded-full mt-2 mr-3 flex-shrink-0"></span>
              <div>
                <span className="font-semibold">Customize Message Content:</span>
                <span className="ml-1">
                  Create balanced templates for offers, product updates, reminders or announcements that align with your
                  brand voice.
                </span>
              </div>
            </div>
            <div className="flex items-start">
              <span className="w-2 h-2 bg-white rounded-full mt-2 mr-3 flex-shrink-0"></span>
              <div>
                <span className="font-semibold">Choose Media Format:</span>
                <span className="ml-1">
                  Design templates using text, images, videos, or interactive elements to match your campaign goals.
                </span>
              </div>
            </div>
            <div className="flex items-start">
              <span className="w-2 h-2 bg-white rounded-full mt-2 mr-3 flex-shrink-0"></span>
              <div>
                <span className="font-semibold">Quick Campaign Launch:</span>
                <span className="ml-1">Save time by reusing pre-approved templates for future ad campaigns.</span>
              </div>
            </div>
            <div className="flex items-start">
              <span className="w-2 h-2 bg-white rounded-full mt-2 mr-3 flex-shrink-0"></span>
              <div>
                <span className="font-semibold">Easy Access Campaigns:</span>
                <span className="ml-1">Maintain a uniform brand experience with standardized message structures.</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white py-3 px-6 rounded font-medium transition-colors"
          >
            Create Template
          </button>
        </div>
      </div>
      {/* Create template using AI */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-red-600 mb-6">Create template using AI</h2>
        <div className="bg-red-800 rounded-lg p-6 text-white">
          <div className="space-y-3 mb-6">
            <div className="flex items-start">
              <span className="w-2 h-2 bg-white rounded-full mt-2 mr-3 flex-shrink-0"></span>
              <div>
                <span className="font-semibold">Auto-Generate Message Content:</span>
                <span className="ml-1">
                  Let AI craft engaging message templates for your campaigns, offers, reminders, and more—all in a few
                  keywords or prompts.
                </span>
              </div>
            </div>
            <div className="flex items-start">
              <span className="w-2 h-2 bg-white rounded-full mt-2 mr-3 flex-shrink-0"></span>
              <div>
                <span className="font-semibold">Smart Personalisation:</span>
                <span className="ml-1">
                  Automatically insert customer names, product details, or location data to boost relevance and response
                  rates.
                </span>
              </div>
            </div>
            <div className="flex items-start">
              <span className="w-2 h-2 bg-white rounded-full mt-2 mr-3 flex-shrink-0"></span>
              <div>
                <span className="font-semibold">Industry-Specific Templates:</span>
                <span className="ml-1">
                  Generate templates for retail, promotions, or conversational tones to match your brand voice.
                </span>
              </div>
            </div>
            <div className="flex items-start">
              <span className="w-2 h-2 bg-white rounded-full mt-2 mr-3 flex-shrink-0"></span>
              <div>
                <span className="font-semibold">Instant Template Creation:</span>
                <span className="ml-1">
                  Get AI-recommended subject lines, CTAs, or button styles to optimise your campaign performance.
                </span>
              </div>
            </div>
            <div className="flex items-start">
              <span className="w-2 h-2 bg-white rounded-full mt-2 mr-3 flex-shrink-0"></span>
              <div>
                <span className="font-semibold">A/B Testing Support:</span>
                <span className="ml-1">
                  Create multiple versions of a message to test what resonates best with your audience.
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white py-3 px-6 rounded font-medium transition-colors"
          >
            Generate with AI Template Creation
          </button>
        </div>
      </div>
      {/* Modal */}
      <CreateTemplateModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  )
}
export default TemplatesPage
