"use client";

import { renderInstance } from "@/utils/Axios/RenderInstance";
import { errorMessage, successMessage } from "@/utils/Toastify/Messages";
import { Country } from "@/utils/Types/types";
import { Backdrop, CircularProgress } from "@mui/material";
import { MoreVerticalIcon } from "lucide-react";
import { useCookie } from "next-cookie";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTrigger,
} from "@/components/ui/dialog";
import AddIcon from "@mui/icons-material/Add";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import subcontinentRegions from "@/utils/AllSubContinentDetails";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

const CountrySection = () => {
  const [bacOpen, setBacOpen] = useState(false);
  const [fetchingContry, setFetchingCountry] = useState(false);
  const [deleteContry, setDeleteCountry] = useState(false);
  const [country, setCountry] = useState<Country[]>([]);
  const [editOptionShow, setEditOptionShow] = useState(-1);

  const [addNewCountry, setAddNewCountry] = useState(false)
  const [newCountry, setNewCountry] = useState("")
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
        errorMessage("Error fetching roles");
      })
      .finally(() => {
        setFetchingCountry(false);
      });
  }

  function handleRemoveRoleSubmit(e: any, roleid: string) {
    e.preventDefault();
    setDeleteCountry(true);
    renderInstance
      .delete(`/country/${roleid}`, {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      })
      .then((res) => {
        if (res.status === 200 && res.data === "Deleted")
          successMessage(res.data);
        refresh();
      })
      .catch((err) => {
        console.log(err)
        if (
          err.response &&
          err.response.status === 409 &&
          err.response.data.message === "Wrong role id"
        ) {
          errorMessage("Wrong role id");
        } else errorMessage("Some error occured while deleting the role");
      })
      .finally(() => {
        fetchAllCountry();
        setDeleteCountry(false);
      });
  }

  function getContinentByCountry(countryName: string): string | null {
    for (const continent in subcontinentRegions) {
      if (subcontinentRegions[continent].includes(countryName)) {
        return continent;
      }
    }
    return null; // Return null if the country is not found
  }

  function validateCountry(countryName: string): boolean {
    let isCountry = false
    for (const continent in subcontinentRegions) {
      if (subcontinentRegions[continent].includes(countryName)) {
        isCountry = true
      }
    }
    return isCountry; // Return null if the country is not found
  }

  function handleCreateCountry(){
    if(!newCountry){
      errorMessage("Please select a country")
      return
    }

    if(!validateCountry(newCountry)){
      errorMessage("Invalid country")
      return
    }

    if(!countryCode){
      errorMessage("Please give the country code")
      return
    }

    setBacOpen(true)
    renderInstance.post("/country", {
      name: newCountry,
      region: getContinentByCountry(newCountry),
      country_code: countryCode
    }, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    }).then((res)=>{
      successMessage("Added")
      setNewCountry("")
      setCountryCode("")
      setAddNewCountry(false)
      fetchAllCountry()
    }).catch((err)=>{
      errorMessage("Some error occurred")
    }).finally(()=>{
      setBacOpen(false)
      refresh()
    })
  }

  useEffect(() => {
    fetchAllCountry();
  }, []);

  return (
    <div className="w-full">
      <Backdrop
        sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={bacOpen || deleteContry || fetchingContry}
      >
        {bacOpen && <p>Adding this country to the list</p>}
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
              Add new country
            </button>
          </DialogTrigger>

          <DialogContent
            className="bg-white max-h-[90vh] overflow-auto"
            style={{ scrollbarWidth: "none" }}
          >
            <DialogHeader>
              <p className="text-2xl font-bold text-center">Give country details</p>
            </DialogHeader>

            <div
              className="bg-white rounded-xl p-[30px] text-black flex gap-[16px] flex-col relative max-h-[80vh] overflow-auto"
              style={{ scrollbarWidth: "none" }}
            >
              <label htmlFor="new_role_name" className="text-[26px] font-[600]">
                Select country and region
              </label>

              <Select
                onValueChange={(value) => {
                  setNewCountry(value); // Set the selected country name to newCountry state
                }}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a country" />
                </SelectTrigger>
                <SelectContent>
                  {
                    Object.keys(subcontinentRegions).map((continent, index) => {
                      return (
                        <SelectGroup key={index}>
                          <SelectLabel>
                            {continent}
                          </SelectLabel>
                          {
                            subcontinentRegions[continent].map((country, i) => {
                              return (
                                <SelectItem key={i} value={country}>
                                  {country}
                                </SelectItem>
                              )
                            })
                          }
                        </SelectGroup>
                      )
                    })
                  }
                </SelectContent>
              </Select>

              {
                newCountry && (
                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="country_code">Country code</Label>
                    <Input 
                    type="text" 
                    id="country_code" 
                    placeholder="e.x - +91" 
                    value={countryCode} 
                    onChange={e=>{setCountryCode(e.target.value)}} />
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
        {fetchingContry ? (
          <p>Fetching list</p>
        ) : (
          country.length === 0 && <p>No present present</p>
        )}

        {country.length !== 0 &&
          country.map((role, index) => {
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
                  <strong>{role.name}</strong> ({role.region})
                </p>
                <p className="flex items-center gap-1">
                  <strong>Country code</strong> {role.country_code}
                </p>
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default CountrySection;
