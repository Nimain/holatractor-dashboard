import React from 'react'

const OwnerShrimmer = () => {
    return (
        <div className="flex bg-gray-100 min-h-screen gap-5">

            {/* Main Content Shimmer */}
            <div className="flex-1 ">
                {/* Header Shimmer */}
                <div className="bg-white-600 text-white p-4 flex items-center justify-between shadow-md">
                    {/* Placeholder for the text section */}
                    <div className="flex flex-col space-y-2 w-1/3">
                        <div className="h-6 bg-gray-300 rounded w-3/4 animate-pulse"></div>
                        <div className="h-4 bg-gray-300 rounded w-1/2 animate-pulse"></div>
                    </div>

                    {/* Placeholder for the middle section */}

                    {/* Placeholder for the right section (search and button) */}
                    <div className="flex items-center space-x-6">
                        {/* Shimmer for search input */}
                        <div className="relative w-72">
                            <div className="h-10 bg-gray-300 rounded-full animate-pulse"></div>
                            {/* Search icon shimmer */}
                            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 bg-gray-300 rounded-full animate-pulse"></div>
                        </div>

                        {/* Shimmer for the button */}
                        <div className="w-36 h-10 bg-gray-300 rounded-full animate-pulse"></div>
                    </div>
                </div>

                {/* Content Shimmer */}
                <div className="p-6">
                    <div className="grid grid-cols-2 gap-6">
                        {/* Left Panel */}
                        <div className="relative rounded-[20px] overflow-hidden">
                            {/* Shimmer Slider Placeholder */}
                            <div className="h-80 bg-gray-300 rounded-[20px] animate-pulse"></div>

                            {/* Content Overlay Shimmer */}
                            <div className="absolute inset-0 flex flex-col justify-center items-center p-6 z-20">
                                <div className="h-8 w-3/4 bg-gray-400 rounded animate-pulse mb-4"></div>

                                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                                    {/* Overlapping User Images Shimmer */}
                                    <div className="flex justify-between items-center ml-11">
                                        {Array.from({ length: 3 }).map((_, index) => (
                                            <div
                                                key={index}
                                                className="w-12 h-12 bg-gray-400 rounded-full border-2 border-white overflow-hidden -mr-2 animate-pulse"
                                            ></div>
                                        ))}
                                        <div className="ml-4 h-6 w-32 bg-gray-400 rounded animate-pulse"></div>
                                    </div>

                                    {/* Open Store Button Placeholder */}
                                    <div className="h-12 w-36 bg-gray-400 rounded-full animate-pulse"></div>
                                </div>
                            </div>
                        </div>

                        {/* Right Panel */}
                        <div className="p-0 rounded-[20px] shadow-lg h-80">
                            <div className="h-full w-full bg-gray-300 rounded-[20px] animate-pulse"></div>
                        </div>
                    </div>



                    {/* Bottom Section */}
                    <div
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6"
                        style={{ backgroundColor: '#EAF6FA' }}
                    >
                        {Array.from({ length: 3 }).map((_, index) => (
                            <div
                                key={index}
                                className="p-6 bg-white rounded-[50px] shadow-lg space-y-4"
                            >
                                {/* Avatar Section Placeholder */}
                                <div className="flex items-center space-x-2">
                                    {Array.from({ length: 3 }).map((_, idx) => (
                                        <div
                                            key={idx}
                                            className="w-8 h-8 bg-gray-300 rounded-full border-2 border-white animate-pulse"
                                        ></div>
                                    ))}
                                </div>

                                {/* Title Placeholder */}
                                <div className="h-6 w-32 bg-gray-300 rounded animate-pulse"></div>

                                {/* Button with Line Placeholder */}
                                {/* <div className="relative mt-12">
                <div className="h-0.5 bg-gray-300 animate-pulse"></div>
                <div className="absolute left-1/2 top-[-10px] transform -translate-x-1/2 w-32 h-10 bg-gray-300 rounded-full animate-pulse"></div>
              </div> */}

                                {/* Description Placeholder */}
                                <div className="h-4 w-full bg-gray-300 rounded animate-pulse"></div>
                                <div className="h-4 w-3/4 bg-gray-300 rounded animate-pulse"></div>

                                {/* Navigation Placeholder */}
                                <div className="flex justify-between items-center space-x-4 mt-6">
                                    <div className="h-6 w-10 bg-gray-300 rounded animate-pulse"></div>
                                    <div className="flex space-x-2">
                                        <div className="w-8 h-8 bg-gray-300 rounded-full animate-pulse"></div>
                                        <div className="w-8 h-8 bg-gray-300 rounded-full animate-pulse"></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                </div>
            </div>
        </div>
    )
}

export default OwnerShrimmer