"use client"

import { useEffect, useState } from 'react'
import AddIcon from '@mui/icons-material/Add';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Store } from '@/utils/Types/types';
import { useCookie } from 'next-cookie';
import { renderInstance } from '@/utils/Axios/RenderInstance';
import { errorMessage } from '@/utils/Toastify/Messages';
import Image from 'next/image';
import Link from 'next/link';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command';

const NewLease = () => {
    const [open, setOpen] = useState(false)
    const [allStores, setAllStores] = useState<Store[]>([])
    const [ownerName, setOwnerName] = useState("")
    const [fetchingStores, setFetchingStores] = useState(false)
  
    const [popoverOpen, setPopoverOpen] = useState(true)
    const [storeName, setStoreName] = useState("")
  
    const { cookie } = useCookie()
    const access_token = cookie.get("access_token")
  
    function fetchAllStores() {
      if (access_token) {
        setFetchingStores(true)
        renderInstance.get("/store", {
          headers: {
            Authorization: `Bearer ${access_token}`,
          }
        })
          .then((res) => {
            if (res.status === 200) setAllStores(res.data)
          }).catch((err) => {
            errorMessage("Error in fetching inventory lists")
          }).finally(() => { setFetchingStores(false) })
      } else errorMessage("Admin not logged in")
    }
  
    useEffect(() => {
      fetchAllStores()
    }, [])
  
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <button
            name="new_tractor_add"
            className="px-[20px] py-[10px] text-[18px] rounded-md bg-black text-white w-fit flex items-center justify-center gap-[10px] ml-auto"
            onClick={() => {
              setOpen(true);
            }}
          >
            <AddIcon />
            <span>New Lease</span>
          </button>
        </DialogTrigger>
  
        <DialogContent
          className="bg-white max-h-[90vh] w-[90vw] max-w-[900px] overflow-auto"
          style={{ scrollbarWidth: "none" }}
        >
          <DialogHeader>
            <p className="text-2xl font-bold text-center">
              Select a store
            </p>
          </DialogHeader>
  
          <Command>
            <CommandInput placeholder="Search store..." />
            <CommandList className={`bg-white rounded-xl p-6 grid grid-cols-4 gap-5 relative overflow-auto h-[80vh]`}>
              <CommandEmpty>No store found.</CommandEmpty>
              <CommandGroup className='w-full'>
                {allStores.map((details, index) => {
                  const name = details.agentOwner ?  `${details.agentOwner.user.first_name} ${details.agentOwner.user.middle_name ?? ""} ${details.agentOwner.user.last_name}` : `${details.owner.user.first_name} ${details.owner.user.middle_name ?? ""} ${details.owner.user.last_name}`
                  return (
                    <CommandItem
                      key={index}
                      value={details.name}
                      onSelect={(currentValue) => {
                        setStoreName(details.name)
                        setPopoverOpen(false)
                      }}
                      className={`border-2 rounded-xl flex flex-col gap-5 p-2`}
                    >
                      {details.image ? (
                        <Image
                          src={details.image}
                          alt="tractor_image"
                          className="w-full h-32 object-cover rounded-xl"
                          width={300}
                          height={400}
                          unoptimized={true}
                        />
                      ) : (
                        <Image
                          src={"https://wallpapercave.com/wp/wp13088808.jpg"}
                          alt="tractor_image"
                          className="w-full h-32 object-cover rounded-xl"
                          width={300}
                          height={400}
                          unoptimized={true}
                        />
                      )}
    
                      <div>
                        <strong>{details.name}</strong>
                        <p>
                          <strong>Description:</strong>
                          <span>{details.description}</span>
                        </p>
                        <p>
                          <strong>Owner:</strong>
                          <span>{`${name}`}</span>
                        </p>
                      </div>
    
                      <Link
                        href={`/Store/${details.id}/booking/lease`}
                        className="px-4 py-2 bg-black text-white rounded-md mx-auto w-full"
                      >
                        Select
                      </Link>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    )
}

export default NewLease