import { ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

function DetailBox({ 
  count, 
  heading, 
  icon, 
  bgcolorCode, 
  textcolorCode, 
  href 
}: { 
  count: string; 
  heading: string; 
  icon: ReactNode; 
  bgcolorCode: string; 
  textcolorCode: string; 
  href: string; 
}) {
  return (
    <Link href={href} className="w-full h-full block">
      <motion.div 
        className="bg-white w-full h-full rounded-xl shadow-lg overflow-hidden flex flex-col relative"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        whileHover={{ 
          scale: 1.02,
          boxShadow: "0 10px 20px rgba(0,0,0,0.1)",
          y: -5
        }}
      >
        {/* Top curved accent */}
        <motion.div 
          className={`absolute top-0 right-0 w-24 h-24 rounded-bl-full ${bgcolorCode} opacity-10`}
          whileHover={{ width: 120, height: 120 }}
          transition={{ duration: 0.3 }}
        />
        
        <div className="flex items-center p-6 relative z-10">
          {/* Animated icon container */}
          <motion.div 
            className={`${bgcolorCode} ${textcolorCode} w-12 h-12 rounded-xl flex items-center justify-center shadow-md`}
            whileHover={{ rotate: [0, -10, 10, -5, 0], scale: 1.1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-xl">
              {icon}
            </div>
          </motion.div>
          
          {/* Content container with animated counter */}
          <div className="ml-5 flex flex-col">
            <motion.div 
              className="text-3xl font-bold"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              {count}
            </motion.div>
            
            <motion.div 
              className="text-sm font-medium text-gray-500 mt-1"
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              {heading}
            </motion.div>
          </div>
        </div>
        
        {/* Animated progress indicator */}
        <div className="px-6 pb-5 pt-1 mt-auto">
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <motion.div 
              className={`${bgcolorCode} h-1.5 rounded-full`}
              initial={{ width: 0 }}
              animate={{ width: "75%" }}
              transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
              whileHover={{ width: "100%" }}
            />
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

export default DetailBox;