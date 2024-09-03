"use client"

import { renderInstance } from '@/utils/Axios/RenderInstance';
import { errorMessage, successMessage } from '@/utils/Toastify/Messages';
import { City, Country } from '@/utils/Types/types';
import { Backdrop, CircularProgress } from '@mui/material';
import { useCookie } from 'next-cookie';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react'
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTrigger } from '../ui/dialog';
import AddIcon from "@mui/icons-material/Add";
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Button } from '../ui/button';
import { Check, ChevronsUpDown, MoreVerticalIcon } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command';
import { cn } from '@/lib/utils';
import { Label } from '../ui/label';
import { Input } from '../ui/input';

const CitySection = () => {

  const [bacOpen, setBacOpen] = useState(false);
  const [fetchingContry, setFetchingCountry] = useState(false);
  const [fetchingCity, setFetchingCity] = useState(false);
  const [deleteContry, setDeleteCountry] = useState(false);
  const [country, setCountry] = useState<Country[]>([]);
  const [city, setCity] = useState<City[]>([]);
  const [editOptionShow, setEditOptionShow] = useState(-1);

  const [addNewCountry, setAddNewCountry] = useState(false)
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [newCountry, setNewCountry] = useState("")
  const [newCountryId, setNewCountryId] = useState("")
  const [countryCode, setCountryCode] = useState("")

  const { cookie } = useCookie();
  const access_token = cookie.get("access_token");

  const { refresh } = useRouter();

  function fetchAllCountry() {
    setFetchingCountry(true);
    renderInstance
      .get("/country", {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      })
      .then((res) => {
        setCountry(res.data);
      })
      .catch((err) => {
        errorMessage("Error fetching cities");
      })
      .finally(() => {
        setFetchingCountry(false);
      });
  }

  function fetchAllCity() {
    setFetchingCity(true);
    renderInstance
      .get("/city", {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      })
      .then((res) => {
        setCity(res.data);
      })
      .catch((err) => {
        errorMessage("Error fetching cities");
      })
      .finally(() => {
        setFetchingCity(false);
      });
  }

  function handleRemoveRoleSubmit(e: any, roleid: string) {
    e.preventDefault();
    setDeleteCountry(true);
    renderInstance
      .delete(`/city/${roleid}`, {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      })
      .then((res) => {
        if (res.status === 200)
          successMessage(res.data);
        refresh();
      })
      .catch((err) => {
        errorMessage("Some error occured while deleting the role");
      })
      .finally(() => {
        fetchAllCountry();
        setDeleteCountry(false);
      });
  }

  function handleCreateCountry() {
    if (!newCountryId) {
      errorMessage("Please select a country")
      return
    }

    if (!countryCode) {
      errorMessage("Please give the city name")
      return
    }

    setBacOpen(true)
    renderInstance.post("/city", {
      name: countryCode,
      country_id: newCountryId
    }, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    }).then((res) => {
      successMessage("Added")
      setNewCountry("")
      setCountryCode("")
      setAddNewCountry(false)
      fetchAllCountry()
    }).catch((err) => {
      errorMessage("Some error occurred")
    }).finally(() => {
      setBacOpen(false)
      refresh()
    })
  }

  useEffect(() => {
    fetchAllCountry();
    fetchAllCity();
  }, []);

  return (
    <div className="w-full">
      <Backdrop
        sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={bacOpen || deleteContry || fetchingContry}
      >
        {bacOpen && <p>Adding this city to the list</p>}
        {deleteContry && <p>Deleting</p>}
        {fetchingContry && <CircularProgress />}
      </Backdrop>

      <div className="w-full py-[40px] flex items-center justify-end gap-[40px]">
        <Dialog open={addNewCountry} onOpenChange={setAddNewCountry}>
          <DialogTrigger asChild>
            <button
              name="add__new_role"
              className="px-[20px] py-[10px] bg-black text-white text-[18px] rounded flex items-center gap-[10px]"
              onClick={() => {
                setAddNewCountry(true);
              }}
            >
              <AddIcon />
              Add new city
            </button>
          </DialogTrigger>

          <DialogContent
            className="bg-white max-h-[90vh] max-w-[600px] overflow-auto"
            style={{ scrollbarWidth: "none" }}
          >
            <DialogHeader>
              <p className="text-2xl font-bold text-center">Give city details</p>
            </DialogHeader>

            <div
              className="bg-white rounded-xl p-[30px] text-black flex gap-[16px] flex-col relative max-h-[80vh] overflow-auto"
              style={{ scrollbarWidth: "none" }}
            >
              <Label htmlFor="new_role_name" className="text-lg font-[600]">
                Select country
              </Label>

              <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    // aria-expanded={popoverOpen}
                    className="w-full justify-between"
                  >
                    {newCountry
                      ? country.find((countryDel) => countryDel.name === newCountry) && newCountry
                      : "Select country..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search country..." />
                    <CommandList>
                      <CommandEmpty>No country found.</CommandEmpty>
                      <CommandGroup className='w-full'>
                        {fetchingContry ?
                          <p>Fetching all country list</p>
                          :
                          country.length === 0 ?
                            <p>No countries available</p>
                            :
                            country.map((countryDel, i) => (
                              <CommandItem
                                key={i}
                                value={countryDel.name}
                                onSelect={(currentValue) => {
                                  setNewCountry(countryDel.name)
                                  setNewCountryId(countryDel.id)
                                  setPopoverOpen(false)
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    newCountry === countryDel.name ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {countryDel.name}
                              </CommandItem>
                            ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {
                newCountry && (
                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="country_code" className="text-lg font-[600]">City name</Label>
                    <Input
                      type="text"
                      id="country_code"
                      placeholder="London"
                      value={countryCode}
                      onChange={e => { setCountryCode(e.target.value) }} />
                  </div>
                )
              }
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <button
                  name="add_task_cancel_button"
                  className="text-white bg-black font-semibold px-5 py-2 rounded-md"
                  onClick={() => {
                    setAddNewCountry(false);
                  }}
                >
                  Close
                </button>
              </DialogClose>

              <button
                name="add_role_submit_button"
                className="px-[20px] py-[10px] bg-black text-white text-[18px] rounded flex items-center gap-[10px] w-fit mx-auto"
                onClick={(e) => {
                  handleCreateCountry();
                }}
              >
                Add
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-4 gap-8 w-full">
        {fetchingCity ? (
          <p>Fetching list</p>
        ) : (
          city.length === 0 && <p>No city present</p>
        )}

        {city.length !== 0 &&
          city.map((role, index) => {
            return (
              <div
                className={`bg-white flex-1 flex flex-col gap-2 px-2 w-full py-[20px] shadow-xl rounded-md text-[18px] cursor-pointer relative`}
                // onClick={() => { setActiveRole(roleNames) }}
                key={index}
              >
                <div
                  className={`absolute right-[4px] top-1/2 -translate-y-1/2 w-[26px] h-[26px] rounded-full hover:bg-gray-200 flex items-center justify-center cursor-pointer transition-all duration-500`}
                  onClick={(e) => {
                    setEditOptionShow(index);
                  }}
                >
                  <MoreVerticalIcon />
                </div>

                {editOptionShow === index && (
                  <div className="absolute top-0 right-[-20px] bg-white flex flex-col text-[14px] gap-[4px] p-[10px] shadow-md rounded-md">
                    <button
                      name="remove_specific_role"
                      onClick={(e) => {
                        handleRemoveRoleSubmit(e, role.id);
                      }}
                    >
                      Remove
                    </button>
                  </div>
                )}
                <p className="flex items-center gap-1">
                  <strong>{role.name}</strong>
                </p>
                <p className="flex items-center gap-1">
                  <strong>Country</strong> {role.country.name}
                </p>
              </div>
            );
          })}
      </div>
    </div>
  )
}

export default CitySection