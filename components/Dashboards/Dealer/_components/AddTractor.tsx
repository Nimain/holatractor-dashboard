"use client"
import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Image from 'next/image'
import { renderInstance } from '@/utils/Axios/RenderInstance'
import { errorMessage } from '@/utils/Toastify/Messages'
import { CircularProgress } from '@mui/material'
import { AddTractorModal } from '../Modals/AddTractorModal'

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
}

export default function AddTractor({ alreadyTractors }: AddTractorProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [tractors, setTractors] = useState<Tractor[]>([])
  const [fetchingTractors, setFetchingTractors] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTractor, setSelectedTractor] = useState<Tractor | null>(null)

  // Fetch tractors from the /tractor endpoint
  useEffect(() => {
    async function fetchTractors() {
      setFetchingTractors(true)
      try {
        const response = await renderInstance.get('/tractor')
        setTractors(response.data)
      } catch (err) {
        errorMessage('Error fetching tractor details')
      } finally {
        setFetchingTractors(false)
      }
    }
    fetchTractors()
  }, [])

  // Filter tractors based on search term and exclude already added tractors
  const filteredTractors = tractors.filter(
    (tractor) =>
      (tractor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
       tractor.model.toLowerCase().includes(searchTerm.toLowerCase())) &&
      !alreadyTractors.some((added) => added.baseTractor.id === tractor.id)
  )

  return (
    <>
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="pt-6 px-4 pb-4">
          <div className="flex items-center space-x-2 mb-6">
            <Search className="w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search tractors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-grow"
            />
          </div>
          {fetchingTractors ? (
            <div className="flex justify-center">
              <CircularProgress />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTractors.length === 0 ? (
                <p className="text-center col-span-full">No tractors available</p>
              ) : (
                filteredTractors.map((tractor) => (
                  <Card key={tractor.id}>
                    <CardHeader>
                      <CardTitle>{tractor.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {tractor.images[0] && (
                          <Image
                            src={tractor.images[0]}
                            alt={tractor.name}
                            width={100}
                            height={100}
                            className="w-24 h-24 object-cover rounded"
                          />
                        )}
                        {/* <p className="text-sm text-gray-600"><strong>Description:</strong> {tractor.description}</p> */}
                        <p className="text-sm text-gray-600"><strong>Model:</strong> {tractor.model}</p>
                        <p className="text-sm text-gray-600"><strong>Type:</strong> {tractor.type}</p>
                        {/* <p className="text-sm text-gray-600"><strong>Year:</strong> {new Date(tractor.year).getFullYear()}</p> */}
                        {/* <p className="text-sm text-gray-600"><strong>Fixed Price:</strong> ${tractor.inventory[0]?.fixedPrice || 'N/A'}</p> */}
                      </div>
                      <Button
                        onClick={() => {
                          setSelectedTractor(tractor)
                          setIsModalOpen(true)
                        }}
                        className="mt-4"
                      >
                        Add to Store
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <AddTractorModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        selectedTractor={selectedTractor}
      />
    </>
  )
}