"use client";

import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/solid";

const ChatButton = () => {
  const openChatbot = () => {
    // Simple - just open the chatbot
    window.open("http://localhost:3000", "_blank", "width=800,height=600");
  };

  return (
    <button
      onClick={openChatbot}
      className="fixed bottom-6 right-6 bg-orange-500 hover:bg-orange-600 text-white p-4 rounded-full shadow-lg transition-all duration-300 z-50"
      title="Chat with AI Assistant"
    >
      <ChatBubbleLeftRightIcon className="w-6 h-6" />
    </button>
  );
};

export default ChatButton;
