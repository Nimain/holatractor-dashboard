'use client'

import { Search, Mail, Store, MoreVertical, Heart, ChevronLeft, ChevronRight, Plus, MoreHorizontal } from 'lucide-react'
import { Progress } from "@/components/ui/progress"
import { Bar, BarChart, XAxis, YAxis } from "recharts"
import { ChartContainer } from "@/components/ui/chart"
import Image from "next/image"
import AddStoreModal from '@/components/Dashboards/Dealer/_components/AddStoreModal'
import { useState } from 'react'
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Course {
  id: number
  title: string
  category: string
  progress: string
  image: string
  mentor: {
    name: string
    role: string
    avatar: string
  }
}

interface Mentor {
  name: string
  role: string
  avatar: string
  verified?: boolean
}

export default function CoursePlatform() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const router = useRouter();

  const courses: Course[] = [
    {
      id: 1,
      title: "Beginner's Guide to Becoming a Professional Front-End Developer",
      category: "FRONT END",
      progress: "2/8 watched",
      image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT52-acQeTiM74JEEdoHKWGeOGs-C9uLx5deQ&s",
      mentor: {
        name: "Leonardo samsul",
        role: "Mentor",
        avatar: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQJkPZY_sSpXLHyqUr_6WAB4oXmauRcUvHISQ&s"
      }
    },
    {
      id: 2,
      title: "Optimizing User Experience with the Best UI/UX Design",
      category: "UI/UX DESIGN",
      progress: "3/8 watched",
      image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT52-acQeTiM74JEEdoHKWGeOGs-C9uLx5deQ&s",
      mentor: {
        name: "Bayu Salto",
        role: "Mentor",
        avatar: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQJkPZY_sSpXLHyqUr_6WAB4oXmauRcUvHISQ&s"
      }
    },
    {
      id: 3,
      title: "Reviving and Refresh Company Image",
      category: "BRANDING",
      progress: "6/12 watched",
      image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT52-acQeTiM74JEEdoHKWGeOGs-C9uLx5deQ&s",
      mentor: {
        name: "Padhang Satrio",
        role: "Mentor",
        avatar: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQJkPZY_sSpXLHyqUr_6WAB4oXmauRcUvHISQ&s"
      }
    }
  ]
  const lessons = [
    {
      mentor: {
        name: "Padhang Satrio",
        avatar: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQJkPZY_sSpXLHyqUr_6WAB4oXmauRcUvHISQ&s",
        date: "2/16/2004"
      },
      type: "UI/UX DESIGN",
      desc: "Understand Of UI/UX Design"
    }
  ]
  const chartData = [
    { name: "1-10 Aug", value: 30, fill: "#7C5CFC" },
    { name: "11-20 Aug", value: 45, fill: "#7C5CFC" },
    { name: "21-30 Aug", value: 60, fill: "#7C5CFC" },
    { name: "11-20 Aug", value: 45, fill: "#7C5CFC" },
    { name: "21-30 Aug", value: 60, fill: "#7C5CFC" },
  ]
  const mentors: Mentor[] = [
    { name: "Padhang Satrio", role: "Mentor", avatar: "/placeholder.svg?height=48&width=48", verified: true },
    { name: "Zakir Horizontal", role: "Mentor", avatar: "/placeholder.svg?height=48&width=48", verified: true },
    { name: "Leonardo Samsul", role: "Mentor", avatar: "/placeholder.svg?height=48&width=48", verified: true }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="flex justify-between items-center p-6 mb-8">
        <div className="relative w-1/3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search your course...."
            className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
          />
        </div>
        <div className="flex items-center gap-4">

        <button
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-200"
        onClick={() => setIsModalOpen(true)}
      >
        <Store size={20} className="text-white" />
        Add Store
      </button>
      <AddStoreModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </div>
      </div>

      <div className="grid grid-cols-[1fr_400px]">
        {/* Left content */}
        <div className="p-6 bg-gray-50 min-h-screen">
          {/* Hero Section */}
          <div className="bg-[#7C5CFC] rounded-3xl p-8 mb-8 text-white relative overflow-hidden">
            <div className="absolute right-0 top-0 w-1/2 h-full opacity-20">
              <div className="absolute right-[-100px] top-1/2 transform -translate-y-1/2 w-[400px] h-[400px] border border-white/20 rounded-full" />
              <div className="absolute right-[-50px] top-1/2 transform -translate-y-1/2 w-[300px] h-[300px] border border-white/20 rounded-full" />
              <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-[200px] h-[200px] border border-white/20 rounded-full" />
            </div>
            <div className="text-sm uppercase tracking-wide mb-2">Online Course</div>
            <h1 className="text-4xl font-bold mb-6 max-w-lg leading-tight">
              Sharpen Your Skills with Professional Online Courses
            </h1>
            <button className="bg-black hover:bg-black/90 text-white px-6 py-3 rounded-full flex items-center gap-2 text-sm transition-colors">
              Join Now
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Course Progress */}
          <div className="flex gap-6 mb-8 overflow-x-auto pb-4 scrollbar-hide">
            <div className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm min-w-[240px]">
              <div className="p-3 bg-purple-50 rounded-xl">
                <div className="text-purple-600 font-medium">UI/UX Design</div>
              </div>
              <div className="text-sm text-gray-500">2/8 watched</div>
              <MoreHorizontal size={20} className="text-gray-400 ml-auto cursor-pointer" />
            </div>
            <div className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm min-w-[240px]">
              <div className="p-3 bg-pink-50 rounded-xl">
                <div className="text-pink-600 font-medium">Branding</div>
              </div>
              <div className="text-sm text-gray-500">3/8 watched</div>
              <MoreHorizontal size={20} className="text-gray-400 ml-auto cursor-pointer" />
            </div>
            <div className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm min-w-[240px]">
              <div className="p-3 bg-blue-50 rounded-xl">
                <div className="text-blue-600 font-medium">Front End</div>
              </div>
              <div className="text-sm text-gray-500">6/12 watched</div>
              <MoreHorizontal size={20} className="text-gray-400 ml-auto cursor-pointer" />
            </div>
          </div>

          {/* Continue Watching Section */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">All Store</h2>
              <div className="flex gap-2">
                <button className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
                  <ChevronLeft size={20} className="text-gray-600" />
                </button>
                <button className="p-2 rounded-full bg-[#7C5CFC] hover:bg-[#6B4FD9] text-white transition-colors">
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (

                <div key={course.id} className="bg-white rounded-xl overflow-hidden shadow-sm" onClick={() => router.push('/dealer/addstore')} >
                  <div className="relative">
                    <Image
                      src={course.image}
                      alt={course.title}
                      width={400}
                      height={200}
                      className="w-full h-48 object-cover"
                    />
                    <button className="absolute top-4 right-4 p-2 rounded-full bg-white/80 hover:bg-white transition-colors">
                      <Heart size={20} className="text-gray-600" />
                    </button>
                  </div>
                  <div className="p-4">
                    <div className="text-sm text-[#7C5CFC] font-medium mb-2">{course.category}</div>
                    <h3 className="font-semibold mb-4 line-clamp-2">{course.title}</h3>
                    <div className="flex items-center gap-3">
                      <Image
                        src={course.mentor.avatar}
                        alt={course.mentor.name}
                        width={32}
                        height={32}
                        className="rounded-full"
                      />
                      <div>
                        <div className="text-sm font-medium">{course.mentor.name}</div>
                        <div className="text-xs text-gray-500">{course.mentor.role}</div>
                      </div>
                    </div>
                  </div>
                </div>
                
              ))}
            </div>
          </div>

          {/* Your Lesson Section */}
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Your Lesson</h2>
              <button className="text-[#7C5CFC] text-sm font-medium">See all</button>
            </div>

            <div className="bg-white rounded-xl overflow-hidden">
              <div className="grid grid-cols-4 gap-4 p-4 text-sm text-gray-500 border-b">
                <div>MENTOR</div>
                <div>TYPE</div>
                <div>DESC</div>
                <div>ACTION</div>
              </div>
              {lessons.map((lesson, index) => (
                <div key={index} className="grid grid-cols-4 gap-4 p-4 items-center">
                  <div className="flex items-center gap-3">
                    <Image
                      src={lesson.mentor.avatar}
                      alt={lesson.mentor.name}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                    <div>
                      <div className="font-medium text-sm">{lesson.mentor.name}</div>
                      <div className="text-xs text-gray-500">{lesson.mentor.date}</div>
                    </div>
                  </div>
                  <div className="px-3 py-1 bg-purple-50 text-purple-600 rounded-md w-fit text-sm">
                    {lesson.type}
                  </div>
                  <div className="text-sm">{lesson.desc}</div>
                  <div>
                    <button className="p-2 rounded-full bg-[#7C5CFC] text-white">
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right content */}
        <div className="p-6 bg-white w-[98%] rounded-2xl">
          <div className="text-center mb-8">
            <div className="relative inline-block">
              <div className="w-20 h-20 rounded-full bg-[#F5F1FF] flex items-center justify-center relative">
                <img
                  src="/placeholder.svg?height=80&width=80"
                  alt="Profile"
                  className="w-16 h-16 rounded-full object-cover"
                />
                <svg className="absolute inset-0 w-full h-full rotate-[-90deg]">
                  <circle
                    cx="40"
                    cy="40"
                    r="38"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    className="text-[#F5F1FF]"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="38"
                    stroke="#7C5CFC"
                    strokeWidth="4"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 38 * 0.32} ${2 * Math.PI * 38 * (1 - 0.32)
                      }`}
                    className="drop-shadow-[0_2px_4px_rgba(124,92,252,0.4)]"
                  />
                </svg>
                <span className="absolute -top-1 -right-1 bg-[#7C5CFC] text-white text-xs px-2 py-0.5 rounded-full shadow-lg">
                  32%
                </span>
              </div>
            </div>
            <h3 className="text-lg font-bold mt-4 mb-1">Good Morning Jason 🔥</h3>
            <p className="text-sm text-gray-500">
              Continue your learning to achieve your target!
            </p>
          </div>

          <div className="mb-8 bg-[#F8F7FF] p-6 rounded-[20px]">
            <ChartContainer
              className="h-[170px]"
              config={{
                value: {
                  color: "#7C5CFC",
                },
              }}
            >
              <BarChart data={chartData}>
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  fontSize={12}
                  tickMargin={8}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  fontSize={12}
                  tickMargin={8}
                />
                <Bar
                  dataKey="value"
                  radius={[4, 4, 0, 0]}
                  // fill={(props: any) => props.fill}
                  maxBarSize={40}
                />
              </BarChart>
            </ChartContainer>
          </div>

          <div className="bg-[#F8F7FF] p-6 rounded-[20px]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Your mentor</h2>
              <button className="text-[#7C5CFC] hover:bg-white p-1 rounded-full transition-colors">
                <Plus size={20} />
              </button>
            </div>
            <div className="space-y-4">
              {mentors.map((mentor, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src={mentor.avatar}
                        alt={mentor.name}
                        className="w-12 h-12 rounded-full bg-[#F5F1FF] object-cover"
                      />
                      {mentor.verified && (
                        <div className="absolute -bottom-1 -right-1 bg-[#7C5CFC] text-white p-1 rounded-full shadow-lg">
                          <div className="w-2 h-2 bg-white rounded-full" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-medium">{mentor.name}</div>
                      <div className="text-sm text-gray-500">{mentor.role}</div>
                    </div>
                  </div>
                  <button className="text-[#7C5CFC] px-4 py-1.5 rounded-full bg-[#F5F1FF] text-sm font-medium hover:bg-[#EBE5FF] transition-colors">
                    Follow
                  </button>
                </div>
              ))}
            </div>
            <button className="w-full text-center text-[#7C5CFC] mt-6 py-2.5 bg-[#F5F1FF] rounded-xl text-sm font-medium hover:bg-[#EBE5FF] transition-colors">
              See All
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}