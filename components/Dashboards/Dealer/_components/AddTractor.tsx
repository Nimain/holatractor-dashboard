"use client"
import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { AddTractorModal } from '../Modals/AddTractorModal'

interface AddTractorProps {
  alreadyTractors: any[]
}

export default function AddTractor({ alreadyTractors }: AddTractorProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  return (
    <>
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6 px-4 pb-4 flex flex-col items-center text-center">
          <div className="w-32 h-32 rounded-full overflow-hidden mb-6">
            <Image
              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ5l-rb7GY5lMDO9H6SCqcx7oKfhXXxEa6F0w&s"
              alt="Tractor in field"
              width={128}
              height={128}
              className="w-full h-full object-cover"
            />
          </div>
          <h2 className="text-2xl font-bold mb-2">Add New Tractor</h2>
          <p className="text-muted-foreground mb-6">
            Click to add a new tractor to your inventory
          </p>
          <Button 
            className="bg-[#0f172a] hover:bg-[#1e293b] text-white flex items-center gap-2 px-6"
            size="lg"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus className="w-5 h-5" />
            Add tractor
          </Button>
        </CardContent>
      </Card>
      <AddTractorModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </>
  )
}