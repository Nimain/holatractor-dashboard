"use client";
import { useState } from "react";
import CreateTemplateModal from "./CreateTemplateModal";

const TemplatesPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const existingTemplates = [
    { id: 1, title: "Ecommerce Templates" },
    { id: 2, title: "Ecommerce Templates" },
    { id: 3, title: "Ecommerce Templates" },
  ];

  const userTemplates = [
    { id: 1, title: "Template 1" },
    { id: 2, title: "Template 2" },
    { id: 3, title: "Template 3" },
  ];

  return (
    <div className="w-full mx-auto p-4 sm:p-6 bg-gray-100 min-h-screen">
      {/* Header */}
      <div className="mb-8 text-center sm:text-left">
        <h1 className="text-3xl sm:text-4xl font-bold text-red-600 mb-2">
          Templates
        </h1>
      </div>

      {/* Choose from Existing Templates */}
      <div className="mb-10">
        <h2 className="text-lg sm:text-xl font-semibold text-red-600 mb-6 text-center sm:text-left">
          Choose from existing Templates
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {existingTemplates.map((template) => (
            <div
              key={template.id}
              className="bg-red-800 rounded-lg p-4 sm:p-5 shadow-lg flex flex-col"
            >
              <div className="bg-gray-200 rounded-lg h-32 sm:h-40 flex items-center justify-center mb-4">
                <span className="text-gray-600 font-medium text-sm sm:text-base">
                  Preview
                </span>
              </div>
              <h3 className="text-white font-medium mb-4 text-center sm:text-left text-base sm:text-lg">
                {template.title}
              </h3>
              <button className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded font-medium transition-colors text-sm sm:text-base mt-auto">
                View All Templates
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Your Templates */}
      <div className="mb-10">
        <h2 className="text-lg sm:text-xl font-semibold text-red-600 mb-6 text-center sm:text-left">
          Your Templates
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {userTemplates.map((template) => (
            <div
              key={template.id}
              className="bg-red-800 rounded-lg p-4 sm:p-5 shadow-lg flex flex-col"
            >
              <div className="bg-gray-200 rounded-lg h-32 sm:h-40 flex items-center justify-center mb-4">
                <span className="text-gray-600 font-medium text-sm sm:text-base">
                  Preview
                </span>
              </div>
              <h3 className="text-white font-medium mb-4 text-center sm:text-left text-base sm:text-lg">
                {template.title}
              </h3>
              <button className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded font-medium transition-colors text-sm sm:text-base mt-auto">
                Use Template
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Create Your Own Templates */}
      <div className="mb-10">
        <h2 className="text-lg sm:text-xl font-semibold text-red-600 mb-6 text-center sm:text-left">
          Create your own Templates
        </h2>
        <div className="bg-red-800 rounded-lg p-6 sm:p-8 text-white">
          <h3 className="text-lg sm:text-xl font-bold mb-4 text-center sm:text-left">
            Build your own Templates
          </h3>
          <div className="space-y-3 mb-6 text-sm sm:text-base">
            {[
              {
                title: "Customize Message Content:",
                desc: "Create balanced templates for offers, product updates, reminders or announcements that align with your brand voice.",
              },
              {
                title: "Choose Media Format:",
                desc: "Design templates using text, images, videos, or interactive elements to match your campaign goals.",
              },
              {
                title: "Quick Campaign Launch:",
                desc: "Save time by reusing pre-approved templates for future ad campaigns.",
              },
              {
                title: "Easy Access Campaigns:",
                desc: "Maintain a uniform brand experience with standardized message structures.",
              },
            ].map((item, index) => (
              <div key={index} className="flex items-start">
                <span className="w-2 h-2 bg-white rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <div>
                  <span className="font-semibold">{item.title}</span>
                  <span className="ml-1">{item.desc}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center sm:text-left">
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white py-3 px-6 rounded font-medium transition-colors text-sm sm:text-base"
            >
              Create Template
            </button>
          </div>
        </div>
      </div>

      {/* Create Template Using AI */}
      <div className="mb-10">
        <h2 className="text-lg sm:text-xl font-semibold text-red-600 mb-6 text-center sm:text-left">
          Create template using AI
        </h2>
        <div className="bg-red-800 rounded-lg p-6 sm:p-8 text-white">
          <div className="space-y-3 mb-6 text-sm sm:text-base">
            {[
              {
                title: "Auto-Generate Message Content:",
                desc: "Let AI craft engaging message templates for your campaigns, offers, reminders, and more—all in a few keywords or prompts.",
              },
              {
                title: "Smart Personalisation:",
                desc: "Automatically insert customer names, product details, or location data to boost relevance and response rates.",
              },
              {
                title: "Industry-Specific Templates:",
                desc: "Generate templates for retail, promotions, or conversational tones to match your brand voice.",
              },
              {
                title: "Instant Template Creation:",
                desc: "Get AI-recommended subject lines, CTAs, or button styles to optimise your campaign performance.",
              },
              {
                title: "A/B Testing Support:",
                desc: "Create multiple versions of a message to test what resonates best with your audience.",
              },
            ].map((item, index) => (
              <div key={index} className="flex items-start">
                <span className="w-2 h-2 bg-white rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <div>
                  <span className="font-semibold">{item.title}</span>
                  <span className="ml-1">{item.desc}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center sm:text-left">
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white py-3 px-6 rounded font-medium transition-colors text-sm sm:text-base"
            >
              Generate with AI Template Creation
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      <CreateTemplateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default TemplatesPage;
