"use client";

import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/solid";

const ChatButton = () => {
  const openChatbot = async () => {
    const getCookie = (name: string): string | null => {
      if (typeof document === "undefined") return null;
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
      return null;
    };

    const token = getCookie("access_token");
    const user = getCookie("user");

    if (token && user) {
      try {
        // Send token to chatbot via API call
        await fetch("http://localhost:3001/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, user }),
        });

        // Then open chatbot
        window.open("http://localhost:3000", "_blank");
      } catch (error) {
        console.error("Failed to authenticate with chatbot");
        window.open("http://localhost:3000", "_blank"); // Fallback
      }
    } else {
      alert("Please login first");
    }
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
