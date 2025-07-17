"use client"

import { useState, useEffect } from "react"
import { Search } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import { renderInstance } from "@/utils/Axios/RenderInstance"
import { errorMessage } from "@/utils/Toastify/Messages"
import { CircularProgress } from "@mui/material"
import { AddTractorModal } from "../Modals/AddTractorModal"
import { DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface Tractor {
  id: string
  name: string
  description: string
  images: string[]
  model: string
  type: string
  year: string
  inventory: { fixedPrice: number }[]
}

interface AddTractorProps {
  alreadyTractors: any[]
  onTractorAdded?: () => void
}

export default function AddTractor({ alreadyTractors, onTractorAdded }: AddTractorProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [tractors, setTractors] = useState<Tractor[]>([])
  const [fetchingTractors, setFetchingTractors] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTractor, setSelectedTractor] = useState<Tractor | null>(null)

  useEffect(() => {
    async function fetchTractors() {
      setFetchingTractors(true)
      try {
        const response = await renderInstance.get("/tractor")
        setTractors(response.data)
      } catch (err) {
        errorMessage("Error fetching tractor details")
      } finally {
        setFetchingTractors(false)
      }
    }
    fetchTractors()
  }, [])

  const filteredTractors = tractors.filter(
    (tractor) =>
      (tractor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tractor.model.toLowerCase().includes(searchTerm.toLowerCase())) &&
      !alreadyTractors.some((added) => added.baseTractor?.id === tractor.id),
  )

  const handleModalClose = (tractorAdded = false) => {
    setIsModalOpen(false)
    setSelectedTractor(null)
    if (tractorAdded && onTractorAdded) {
      onTractorAdded()
    }
  }

  return (
    <>
      <DialogHeader className="mb-6">
        <DialogTitle className="text-2xl text-left text-white">Add Tractor to Store</DialogTitle>
        <DialogDescription className="text-left text-white/80">
          Select a Tractor to add to your store inventory
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-6">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#A10A0C]" />
          <Input
            placeholder="Search for the tractor"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white text-gray-900 placeholder:text-gray-400 border-gray-300 focus:border-[#A10A0C] focus:ring-[#A10A0C]"
          />
        </div>

        {/* Tractors Grid */}
        {fetchingTractors ? (
          <div className="flex justify-center py-8">
            <CircularProgress />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-h-[calc(90vh-200px)] overflow-y-auto pr-2">
            {filteredTractors.length === 0 ? (
              <p className="text-center col-span-full text-white">No tractors available</p>
            ) : (
              filteredTractors.map((tractor) => (
                <Card key={tractor.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <CardContent className="p-4">
                    {/* Image Placeholder */}
                    <div className="w-full h-24 bg-gray-300 rounded mb-3 flex items-center justify-center">
                      {tractor.images?.[0] ? (
                        <Image
                          src={tractor.images[0] || "/placeholder.svg"}
                          alt={tractor.name}
                          width={100}
                          height={60}
                          className="w-full h-full object-cover rounded"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-300 rounded"></div>
                      )}
                    </div>

                    {/* Tractor Info */}
                    <div className="space-y-1 mb-3">
                      <h3 className="font-semibold text-gray-900 text-sm">{tractor.name}</h3>
                      <p className="text-xs text-gray-600">
                        <span className="font-medium">Model:</span> {tractor.model}
                      </p>
                      <p className="text-xs text-gray-600">
                        <span className="font-medium">Type:</span> {tractor.type}
                      </p>
                    </div>

                    {/* Add Button */}
                    <Button
                      onClick={() => {
                        setSelectedTractor(tractor)
                        setIsModalOpen(true)
                      }}
                      className="w-full bg-[#F76A1E] hover:bg-[#F76A1E]/90 text-white text-sm py-2 rounded"
                    >
                      Add To Store
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>

      {selectedTractor && (
        <AddTractorModal open={isModalOpen} onOpenChange={handleModalClose} selectedTractor={selectedTractor} />
      )}
    </>
  )
}
