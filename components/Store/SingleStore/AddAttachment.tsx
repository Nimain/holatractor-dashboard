"use client";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState, useEffect, useCallback, SetStateAction } from "react";
import AddIcon from "@mui/icons-material/Add";
import { Inventory, AttachmentInStore, Attachment } from "@/utils/Types/types";
import { useCookie } from "next-cookie";
import { renderInstance } from "@/utils/Axios/RenderInstance";
import { errorMessage, successMessage } from "@/utils/Toastify/Messages";
import { Pagination, Autoplay } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/autoplay";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/scrollbar";
import Image from "next/image";
import { useDropzone } from "react-dropzone";
// import { isNumberObject } from "util/types";
import { uploadFileToS3 } from "@/utils/AWS/FileUpload";
import { useParams, useRouter } from "next/navigation";
import { Backdrop, Slider, SliderProps } from "@mui/material";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

function valuetext(value: any) {
  return `${value}$`;
}

const AddAttachment = ({
  alreadyTractors,
}: {
  alreadyTractors: AttachmentInStore[];
}) => {
  const [open, setOpen] = useState(false);
  const [selectedTractorId, setSelectedTractorId] = useState("");
  const [allTractors, setAllTractors] = useState<Inventory[]>([]);
  const [fetchingRoles, setFetchingRoles] = useState(false);
  const [creating, setCreating] = useState(false);
  const [hourlyPrice, setHourlyPrice] = useState<number>();
  const [inventory_id, set_inventoey_id] = useState("")
  const [tractor_id, set_tractor_id] = useState("")
  const [allAttachmentsSelected, setAllAttachmentsSelected] = useState<Attachment[]>([])
  const [fetchingAttachments, setFetchingAttachments] = useState(false)
  const [min_price, set_min_price]= useState<number>(0)
  const [max_price, set_max_price]= useState<number>(0)

  const { cookie } = useCookie();
  const access_token = cookie.get("access_token");

  const { slug } = useParams();
  const { refresh } = useRouter();

  function fetchAllTractors() {
    if (access_token) {
      setFetchingRoles(true);
      renderInstance
        .get("/inventory")
        .then((res) => {
          if (res.status === 200) {
            setAllTractors(res.data);
          }
        })
        .catch((err) => {
          errorMessage("Error in fetching inventory lists");
        })
        .finally(() => {
          setFetchingRoles(false);
        });
    } else errorMessage("Admin not logged in");
  }

  useEffect(() => {
    fetchAllTractors();
  }, []);

  async function saveTractor() {

    if(!hourlyPrice){
      errorMessage("Hourly price ius needed")
      return
    }

    if(hourlyPrice > max_price || hourlyPrice < min_price) {
      errorMessage(`Price should be between ${min_price} and ${max_price}`)
      return
    }

    const addTractorDto = {
      attachment_ids: [selectedTractorId],
      hourly_price: `${hourlyPrice}`,
      inventory_id,
      store_id: slug,
    };

    setCreating(true);
    renderInstance
      .post("/store/addAttachments", addTractorDto, {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      })
      .then((res) => {
        successMessage("Successful");
        refresh();
      })
      .catch((err) => {
        console.log(err)
        errorMessage("Some error occurred");
      })
      .finally(() => {
        setCreating(false);
      });
  }

  function fetchAllAttachments(tractorId: string) {
    if (tractorId) {
      setFetchingAttachments(true)
      renderInstance.get(`/attachment/AttachmentsWithTractors/${tractorId}`)
        .then((res) => {
          setAllAttachmentsSelected(res.data)
        }).catch((err) => {
          errorMessage("Error fething attachments")
        }).then(()=>{ setFetchingAttachments(false) })
    }
  }

  useEffect(()=>{
if(tractor_id) fetchAllAttachments(tractor_id)
  },[tractor_id])

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
          <span>Add attachment</span>
        </button>
      </DialogTrigger>

      <DialogContent
        className="bg-white max-h-[90vh] w-[90vw] max-w-[900px] overflow-auto"
        style={{ scrollbarWidth: "none" }}
      >

        <div
          className={`bg-white rounded-xl p-[30px] ${
            !selectedTractorId && "grid grid-cols-4"
          } gap-5 relative overflow-auto`}
          style={{ scrollbarWidth: "none" }}
        >
          { selectedTractorId ? (
            <div className="w-full h-full flex flex-col items-center justify-center gap-5">
              <div className="space-y-2 w-full">
                <Label>
                  Hourly price
                </Label>
                <Input
                  type="number"
                  placeholder='Give hourly price'
                  value={hourlyPrice}
                  onChange={e => { setHourlyPrice(Number(e.target.value)) }} />
              </div>

              <button
                className="px-5 py-2 bg-black text-white rounded-md mx-auto"
                name="save tractor button"
                onClick={() => {
                  saveTractor();
                }}
              >
                Save
              </button>
            </div>
          )
          :
          fetchingRoles ? (
            "Wait a minute. Loading..."
          ) : allTractors.length === 0 ? (
            "No attachments available to show"
          ) 
          :
          tractor_id ? (
            allAttachmentsSelected.map((details, index) => {
              if(fetchingAttachments) return (
                <p key={index}>
                  Fetching all attachments of this inventory
                </p>
              )
              return (
                <div
                  key={index}
                  className={`border-2 rounded-xl flex flex-col gap-5 p-2`}
                >
                  {details.images.length === 0 ? (
                    <Image
                      src={"https://wallpapercave.com/wp/wp13088808.jpg"}
                      alt="tractor_image"
                      className="w-full h-32 object-cover rounded-xl"
                      width={300}
                      height={400}
                      unoptimized={true}
                    />
                  ) : (
                    <Swiper
                      modules={[Autoplay, Pagination]}
                      spaceBetween={0}
                      slidesPerView={1}
                      loop={true}
                      pagination={true}
                      autoplay={true}
                      className="w-full h-full"
                    >
                      {details.images.map((image, i) => {
                        return (
                          <SwiperSlide key={i}>
                            <Image
                              src={image}
                              alt="tractor_image"
                              className="w-full h-full object-cover rounded-xl"
                              width={300}
                              height={400}
                              unoptimized={true}
                            />
                          </SwiperSlide>
                        );
                      })}
                    </Swiper>
                  )}

                  <div>
                    <strong>{details.name}</strong>
                    <p>
                      <strong>Description:</strong>
                      <span>{details.description}</span>
                    </p>
                  </div>

                  <button
                    name="select button"
                    className="px-4 py-2 bg-black text-white rounded-md mx-auto w-full"
                    onClick={() => {
                      setSelectedTractorId(details.id)
                    }}
                  >
                    Select
                  </button>
                </div>
              );
            })
          ) : (
            allTractors.map((details, index) => {
              return (
                <div
                  key={index}
                  className={`border-2 rounded-xl flex flex-col gap-5 p-2`}
                >
                  {details.tractor.images.length === 0 ? (
                    <Image
                      src={"https://wallpapercave.com/wp/wp13088808.jpg"}
                      alt="tractor_image"
                      className="w-full h-32 object-cover rounded-xl"
                      width={300}
                      height={400}
                      unoptimized={true}
                    />
                  ) : (
                    <Swiper
                      modules={[Autoplay, Pagination]}
                      spaceBetween={0}
                      slidesPerView={1}
                      loop={true}
                      pagination={true}
                      autoplay={true}
                      className="w-full h-full"
                    >
                      {details.tractor.images.map((image, i) => {
                        return (
                          <SwiperSlide key={i}>
                            <Image
                              src={image}
                              alt="tractor_image"
                              className="w-full h-full object-cover rounded-xl"
                              width={300}
                              height={400}
                              unoptimized={true}
                            />
                          </SwiperSlide>
                        );
                      })}
                    </Swiper>
                  )}

                  <div>
                    <strong>{details.tractor.name}</strong>
                    <p>
                      <strong>Description:</strong>
                      <span>{details.tractor.description}</span>
                    </p>
                  </div>

                  <button
                    name="select button"
                    className="px-4 py-2 bg-black text-white rounded-md mx-auto w-full"
                    onClick={() => {
                      set_inventoey_id(details.id)
                      set_min_price(Number(details.min_price))
                      set_max_price(Number(details.max_price))
                      set_tractor_id(details.tractor_id)
                    }}
                  >
                    Select
                  </button>
                </div>
              );
            })
          )}
        </div>

        <Backdrop
          sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
          open={creating}
        >
          {creating && <p>Adding to store</p>}
        </Backdrop>
      </DialogContent>
    </Dialog>
  );
};

export default AddAttachment;
