"use client"
import { useState } from "react"

const CreateTemplateModal = ({ isOpen, onClose }) => {
  const [templateTitle, setTemplateTitle] = useState("")
  const [language, setLanguage] = useState("")
  const [headerEnabled, setHeaderEnabled] = useState(true)
  const [selectedHeaderType, setSelectedHeaderType] = useState("text")
  const [bodyText, setBodyText] = useState("")
  const [buttonTitle, setButtonTitle] = useState("")
  const [buttonType, setButtonType] = useState("")
  const [buttonColor, setButtonColor] = useState("")

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="flex bg-white rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Left Panel - Form */}
        <div className="w-1/2 bg-red-800 text-white p-6 overflow-y-auto">
          {/* Header with close button */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Create Template</h2>
            <button onClick={onClose} className="text-white hover:text-gray-300 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {/* Template Title */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Template Title</label>
            <input
              type="text"
              placeholder="Enter the Title for Template"
              value={templateTitle}
              onChange={(e) => setTemplateTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-black focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          {/* Language */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-black focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">Select the language for the template</option>
              <option value="english">English</option>
              <option value="spanish">Spanish</option>
              <option value="french">French</option>
            </select>
          </div>
          {/* Header Section */}
          <div className="mb-6">
            <div className="flex items-center mb-4">
              <div className="bg-white rounded p-1 mr-2">
                <svg className="w-4 h-4 text-red-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <span className="font-medium mr-4">Header</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={headerEnabled}
                  onChange={(e) => setHeaderEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>
            {headerEnabled && (
              <div>
                <p className="text-sm mb-4">
                  Choose the media type to include at the top of your message template. Attach the actual file when
                  sending the template to your customer.
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={() => setSelectedHeaderType("text")}
                    className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
                      selectedHeaderType === "text"
                        ? "border-orange-500 bg-white text-red-800"
                        : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                    }`}
                  >
                    <svg className="w-6 h-6 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                    <div className="text-sm font-medium">Text</div>
                    <div className="text-xs">Text Header</div>
                  </button>
                  <button
                    onClick={() => setSelectedHeaderType("image")}
                    className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
                      selectedHeaderType === "image"
                        ? "border-orange-500 bg-white text-red-800"
                        : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                    }`}
                  >
                    <svg className="w-6 h-6 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <div className="text-sm font-medium">Image</div>
                    <div className="text-xs">JPG or PNG</div>
                  </button>
                </div>
              </div>
            )}
          </div>
          {/* Body Section */}
          <div className="mb-6">
            <div className="flex items-center mb-4">
              <div className="bg-white rounded p-1 mr-2">
                <svg className="w-4 h-4 text-red-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <span className="font-medium">Body</span>
            </div>
            <p className="text-sm mb-2">
              Enter the text content for the template in the language that you have selected.
            </p>
            <textarea
              placeholder="Description ......"
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-black focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
            />
          </div>
          {/* Button Section */}
          <div className="mb-6">
            <div className="flex items-center mb-4">
              <div className="bg-white rounded p-1 mr-2">
                <svg className="w-4 h-4 text-red-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <span className="font-medium">Button</span>
            </div>
            <p className="text-sm mb-4">Select button name, size, type and colour</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Button Title</label>
                <input
                  type="text"
                  placeholder="Enter the display name of the button"
                  value={buttonTitle}
                  onChange={(e) => setButtonTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-black focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Button Type</label>
                <select
                  value={buttonType}
                  onChange={(e) => setButtonType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-black focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Choose the type of Button</option>
                  <option value="primary">Primary</option>
                  <option value="secondary">Secondary</option>
                  <option value="link">Link</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Button Colour</label>
                <select
                  value={buttonColor}
                  onChange={(e) => setButtonColor(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-black focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Choose the colour for the button</option>
                  <option value="blue">Blue</option>
                  <option value="green">Green</option>
                  <option value="red">Red</option>
                  <option value="orange">Orange</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        {/* Right Panel - Preview */}
        <div className="w-1/2 bg-gray-50 p-6 flex flex-col">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Preview</h3>
          <div className="flex-1 bg-white rounded-lg p-6 shadow-sm">
            {/* Image placeholder */}
            <div className="w-full h-32 bg-gray-200 rounded-lg flex items-center justify-center mb-6">
              <span className="text-gray-500 font-medium">Image</span>
            </div>
            {/* Message content */}
            <div className="mb-6">
              <p className="text-gray-800 font-medium mb-4">Dear {"{name}"},</p>
              <p className="text-gray-700 text-sm leading-relaxed">
                Torem ipsum dolor sit amet, consectetur adipiscing elit. Etiam eu turpis molestie, dictum est a, mattis
                tellus. Sed dignissim, metus nec fringilla accumsan, risus sem sollicitudin lacus, ut interdum tellus
                elit sed risus. Maecenas eget condimentum velit, sit amet feugiat lectus. Class aptent taciti sociosqu
                ad litora torquent per conubia nostra, per inceptos himenaeos.
              </p>
            </div>
            {/* Button */}
            <div className="flex justify-center">
              <button className="bg-blue-500 text-white px-8 py-2 rounded-lg font-medium hover:bg-blue-600 transition-colors">
                Book Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
export default CreateTemplateModal
