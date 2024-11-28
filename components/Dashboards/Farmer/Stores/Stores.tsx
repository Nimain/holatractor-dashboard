"use client"

import Image from 'next/image';

const Stores = () => {
    const centers = [
        {
          name: "Distance",
          rating: 7.5,
          distance: "2 miles",
          service: "Price ",
          price: 587.0,
          image: "https://chehalisfarmstore.com/wp-content/uploads/2023/06/The-Farm-Store-sq.jpg",
        },
        {
          name: "Distance",
          rating: 8.0,
          distance: "8 miles",
          service: "Price",
          price: 490.0,
          image: "https://chehalisfarmstore.com/wp-content/uploads/2023/06/The-Farm-Store-sq.jpg",
        },
        {
          name: "Distance",
          rating: 6.3,
          distance: "28 miles",
          service: "Price",
          price: 325.0,
          image: "https://chehalisfarmstore.com/wp-content/uploads/2023/06/The-Farm-Store-sq.jpg",
        },
        {
          name: "Distance",
          rating: 7.8,
          distance: "5 miles",
          service: "Price",
          price: 450.0,
          image: "https://chehalisfarmstore.com/wp-content/uploads/2023/06/The-Farm-Store-sq.jpg",
        },
        {
          name: "Distance",
          rating: 8.2,
          distance: "12 miles",
          service: "Price",
          price: 275.0,
          image: "https://chehalisfarmstore.com/wp-content/uploads/2023/06/The-Farm-Store-sq.jpg",
        },
        {
          name: "Distance",
          rating: 8.5,
          distance: "15 miles",
          service: "Price",
          price: 899.0,
          image: "https://chehalisfarmstore.com/wp-content/uploads/2023/06/The-Farm-Store-sq.jpg",
        },
      ];
    
      return (
        <div className="min-h-screen bg-gray-50 p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-semibold text-gray-900">Farm store</h1>
              <span className="text-2xl text-gray-500">175</span>
            </div>
    
            <div className="flex gap-4">
              <div className="flex items-center">
                <span className="text-gray-600">All store</span>
                <button className="ml-2 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-sm font-medium">
                  All
                </button>
              </div>
              <button className="p-2 bg-green-50 rounded-full">
                <svg
                  className="w-5 h-5 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </button>
            </div>
          </div>
    
          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {centers.map((center, index) => (
              <div
                key={index}
                className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="relative">
                  <Image
                    src={"https://wallpapercave.com/wp/wp7313761.jpg"}
                    alt={center.name}
                    width={400}
                    height={250}
                    className="w-full h-48 object-cover"
                    placeholder="blur"
                    blurDataURL="https://chehalisfarmstore.com/wp-content/uploads/2023/06/The-Farm-Store-sq.jpg"
                  />
                  <div className="absolute top-4 left-4 bg-white px-2 py-1 rounded-lg shadow-sm">
                    <span className="font-medium">⬥ {center.rating}</span>
                  </div>
                </div>
    
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium text-lg text-gray-900">{center.name}</h3>
                      <div className="flex items-center gap-2 text-gray-500">
                        <span>{center.service}</span>
                        <span>›</span>
                        <div className="text-xl font-semibold text-gray-900">
                    ${center.price.toFixed(2)}
                  </div>
                      </div>
                    </div>
                    <span className="text-gray-500 text-sm">{center.distance}</span>
                  </div>
    
                  
                </div>
              </div>
            ))}
          </div>
        </div>
      );
}

export default Stores