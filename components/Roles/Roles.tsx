"use client"

import { renderInstance } from "@/utils/Axios/RenderInstance";
import { errorMessage, successMessage } from "@/utils/Toastify/Messages";
import { Role } from "@/utils/Types/types";
import { Avatar, Backdrop, CircularProgress } from "@mui/material";
import { MoreVerticalIcon } from "lucide-react";
import { useCookie } from "next-cookie";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTrigger,
} from "@/components/ui/dialog";
import AddIcon from "@mui/icons-material/Add";
import { uploadFileToS3 } from "@/utils/AWS/FileUpload";

const Roles = () => {
  const [open, setOpen] = useState(false);
  const [addNewRole, setAddNewRole] = useState(false);
  const [addNewRoleName, setAddNewRoleName] = useState("");
  const [editOptionShow, setEditOptionShow] = useState(-1);
  const [selectedModules] = useState([]);

  const [roles, setRoles] = useState<Role[]>([]);
  const [fetchingRoles, setFetchingRoles] = useState(false);

  const [loading, setLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [image, setImage] = useState<File | null>(null);

  // Update role state variables
  const [editARole, setEditARole] = useState(false);
  const [editingARole, setEditingARole] = useState(false);
  const [editRoleName, setEditRoleName] = useState("");
  const [editRoleImage, setEditRoleImage] = useState<File | null | string>();
  const [editRoleId, setEditRoleId] = useState("");

  const [deleteRole, setDeleteRole] = useState(false)

  const { cookie } = useCookie();
  const access_token = cookie.get("access_token");

  const router = useRouter();

  function fetchAllRoles() {
    setFetchingRoles(true);
    renderInstance
      .get("/role", {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      })
      .then((res) => {
        setRoles(res.data);
      })
      .catch((err) => {
        errorMessage("Error fetching roles");
      })
      .finally(() => {
        setFetchingRoles(false);
      });
  }

  async function handleCreateRole() {
    if (!addNewRoleName) {
      errorMessage("Please give a name");
      return;
    }

    let imageUrl = "";

    if (image) {
      setImageUploading(true);
      const buffer = Buffer.from(await image.arrayBuffer());
      imageUrl = await uploadFileToS3(buffer, image.name);
      setImageUploading(false);
      if (!imageUrl) {
        errorMessage("Something went wrong in uploading the image");
        return;
      }
    }

    const newRole = {
      name: addNewRoleName.toLowerCase(),
      image: imageUrl,
      allowedModules: selectedModules,
    };

    setLoading(true);

    renderInstance
      .post("/role", newRole, {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      })
      .then((res) => {
        if (res.status === 201) {
          successMessage("Role created successfully");
          setTimeout(() => {
            setOpen(false);
            setEditARole(false);
            setAddNewRole(false);
            setEditRoleName("");
            setImage(null);
            fetchAllRoles();
          }, 3000);
        }
      })
      .catch((err) => {
        if (
          err.response &&
          err.response.status === 409 &&
          err.response.data.message === "Admin is already created"
        ) {
          errorMessage("Admin can't be created");
          setAddNewRoleName("");
        } else if (
          err.response &&
          err.response.status === 409 &&
          err.response.data.message === "Role already present"
        ) {
          errorMessage("Role already present");
          setAddNewRoleName("");
        } else {
          errorMessage("Something went wrong");
        }
      })
      .finally(() => {
        setLoading(false);
        setTimeout(() => {
          router.refresh();
          setOpen(false);
          setEditARole(false);
          setAddNewRole(false);
          setEditRoleName("");
          setImage(null);
        }, 3000);
      });
  }

  function handleEditOptionShow(e: any, index_number: any) {
    e.stopPropagation();
    setEditOptionShow(index_number);
  }

  function handleEditRoleModalOpen(name: string, image: File | string, id: string) {
    setEditRoleName(name);
    setEditRoleImage(image);
    setEditRoleId(id);
    setEditARole(true);
  }

function handleEditRoleModalClose() {
    setEditRoleName("")
    setEditRoleImage(null)
    setEditRoleId('')
    setEditARole(false)
}

const handleEditRoleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditRoleImage(file);
    }
  };

  async function handleEditRole() {
        if (!editRoleName) {
            errorMessage("Please enter the role new name")
        }

        let imageUrl = ''
        let isImageUploaded = false

        if (editRoleImage && typeof editRoleImage !== "string") {
            setImageUploading(true)
            const buffer = Buffer.from(await editRoleImage.arrayBuffer())
            imageUrl = await uploadFileToS3(buffer, editRoleImage.name)
            setImageUploading(false)
            if (!imageUrl) {
                errorMessage("Something went wrong in uploading the image")
                return
            } else isImageUploaded = true
        }

        const updatedRole = isImageUploaded ? {
            name: editRoleName.toLowerCase(),
            image: imageUrl,
        } : {
            name: editRoleName
        }

        setEditingARole(true)

        renderInstance.patch(`/role/${editRoleId}`, updatedRole, {
            headers: {
                Authorization: `Bearer ${access_token}`,
            }
        }).then((res) => {
            if (res.status === 200) {
                successMessage("Role updated successfully")
            }
        }).catch((err) => {
            if (err.response && err.response.status === 409 && err.response.data.message === "Wrong role id") {
                errorMessage("Wrong role id")
            } else if (err.response && err.response.status === 409 && err.response.data.message === "Admin is already created") {
                errorMessage("Admin can't be created")
            } else {
                errorMessage("Something went wrong")
            }
        }).finally(() => {
            setEditingARole(false)
            setTimeout(() => {
                router.refresh()
                fetchAllRoles()
                handleEditRoleModalClose()
            }, 3000);
        })
    }

    function handleRemoveRoleSubmit(e: any, roleid: string) {
        e.preventDefault()
        setDeleteRole(true)
        renderInstance.delete(`/role/${roleid}`, {
            headers: {
                Authorization: `Bearer ${access_token}`,
            }
        })
            .then((res) => {
                if (res.status === 200 && res.data === "Deleted") successMessage(res.data)
                router.refresh()
            }).catch((err) => {
                if (err.response && err.response.status === 409 && err.response.data.message === "Wrong role id") {
                    errorMessage("Wrong role id")
                } else errorMessage("Some error occured while deleting the role")
            })
            .finally(() => { 
              fetchAllRoles()
              setDeleteRole(false)
             })
    }

    useEffect(() => { fetchAllRoles() }, [])

  return (
    <div className="w-full">
      <Backdrop
        sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={imageUploading || loading || editingARole || deleteRole}
      >
        {imageUploading && <p>Image uploading</p>}
        {editingARole && <p>Updating the role</p>}
        {loading && <p>Creating the role</p>}
        {deleteRole && <p>Deleting the role</p>}
      </Backdrop>

      <div className="w-full py-[40px] flex items-center justify-end gap-[40px]">
        <Dialog open={addNewRole} onOpenChange={setAddNewRole}>
          <DialogTrigger asChild>
            <button
              name="add__new_role"
              className="px-[20px] py-[10px] bg-black text-white text-[18px] rounded flex items-center gap-[10px]"
              onClick={() => {
                setAddNewRole(true);
              }}
            >
              <AddIcon />
              Add new role
            </button>
          </DialogTrigger>

          <DialogContent
            className="bg-white max-h-[90vh] overflow-auto"
            style={{ scrollbarWidth: "none" }}
          >
            <DialogHeader>
              <p className="text-2xl font-bold">Give role details</p>
            </DialogHeader>

            <div
              className="bg-white rounded-xl p-[30px] text-black flex gap-[16px] flex-col relative max-h-[80vh] overflow-auto"
              style={{ scrollbarWidth: "none" }}
            >
              <label htmlFor="new_role_name" className="text-[26px] font-[600]">
                Give a name to this new role
              </label>

              <div className="px-[10px] py-[6px] rounded border-[2px] w-full">
                <input
                  type="text"
                  name="new_role_name"
                  id="new_role_name"
                  className="outline-none border-none w-full"
                  placeholder="Enter the role name"
                  value={addNewRoleName}
                  onChange={(e) => {
                    setAddNewRoleName(e.target.value);
                  }}
                />
              </div>

              <div className="flex items-center justify-center w-full">
                {image ? (
                  <Image
                    src={URL.createObjectURL(image)}
                    alt="Role Image"
                    width={150}
                    height={150}
                    className="object-cover rounded"
                  />
                ) : (
                  <label
                    htmlFor="dropzone-file"
                    className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg
                        className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 20 16"
                      >
                        <path
                          stroke="currentColor"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                        />
                      </svg>
                      <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                        <span className="font-semibold">Click to upload</span>{" "}
                        or drag and drop
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        SVG, PNG, JPG or GIF (MAX. 800x400px)
                      </p>
                    </div>
                    <input
                      id="dropzone-file"
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files ? e.target.files[0] : null;
                        if (file) {
                          setImage(file);
                        }
                      }}
                    />
                  </label>
                )}
              </div>
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <button
                  name="add_task_cancel_button"
                  className="text-white bg-black font-semibold px-5 py-2 rounded-md"
                  onClick={() => {
                    setAddNewRole(false);
                  }}
                >
                  Close
                </button>
              </DialogClose>

              <button
                name="add_role_submit_button"
                className="px-[20px] py-[10px] bg-black text-white text-[18px] rounded flex items-center gap-[10px] w-fit mx-auto"
                onClick={(e) => {
                  handleCreateRole();
                }}
              >
                Add
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-4 gap-8 w-full">
        {fetchingRoles ? (
          <p>Fetching roles</p>
        ) : (
          roles.length === 0 && <p>No roles present</p>
        )}

        {roles.length !== 0 &&
          roles.map((role, index) => {
            if (loading) {
              return (
                <div
                  className="bg-white flex-1 flex items-center justify-center px-2 w-full py-5 shadow-xl rounded-md"
                  key={index}
                >
                  <CircularProgress />
                </div>
              );
            }
            return (
              <div
                className={`bg-white flex-1 flex items-center gap-2 px-2 w-full py-[20px] shadow-xl rounded-md text-[18px] cursor-pointer relative ${
                  role.name === "admin" && "hidden"
                }`}
                // onClick={() => { setActiveRole(roleNames) }}
                key={index}
              >
                <div
                  className={`absolute right-[4px] top-1/2 -translate-y-1/2 w-[26px] h-[26px] rounded-full hover:bg-gray-200 flex items-center justify-center cursor-pointer transition-all duration-500`}
                  onClick={(e) => {
                    handleEditOptionShow(e, index);
                  }}
                >
                  <MoreVerticalIcon />
                </div>

                {editOptionShow === index && (
                  <div className="absolute top-0 right-[-20px] bg-white flex flex-col text-[14px] gap-[4px] p-[10px] shadow-md rounded-md">
                    <Dialog open={editARole} onOpenChange={setEditARole}>
                      <DialogTrigger asChild>
                        <button
                          name="edit_specific_role"
                          onClick={() => {
                            handleEditRoleModalOpen(
                              role.name,
                              role.image as string,
                              role.id
                            );
                          }}
                        >
                          Edit
                        </button>
                      </DialogTrigger>

                      <DialogContent
                        className="bg-white max-h-[90vh] overflow-auto"
                        style={{ scrollbarWidth: "none" }}
                      >
                        <DialogHeader>
                          <p className="text-2xl font-bold">
                            Give updated role details
                          </p>
                        </DialogHeader>

                        <div
                          className="bg-white rounded-xl p-[30px] text-black flex gap-[16px] flex-col relative max-h-[80vh] overflow-auto"
                          style={{ scrollbarWidth: "none" }}
                        >
                          <label
                            htmlFor="new_role_name"
                            className="text-[26px] font-[600]"
                          >
                            Give a new name
                          </label>

                          <div className="px-[10px] py-[6px] rounded border-[2px] w-full">
                            <input
                              type="text"
                              name="new_role_name"
                              id="new_role_name"
                              className="outline-none border-none w-full"
                              placeholder="Enter the role name"
                              value={editRoleName}
                              onChange={(e) => {
                                setEditRoleName(e.target.value);
                              }}
                            />
                          </div>

                          <div className="flex items-center justify-center flex-col gap-2 w-full">
                            {editRoleImage ? (
                              <Image
                                src={
                                  typeof editRoleImage === "string"
                                    ? editRoleImage
                                    : URL.createObjectURL(editRoleImage)
                                }
                                alt="Role Image"
                                width={150}
                                height={150}
                                className="object-cover rounded"
                              />
                            ) : (
                              <label
                                htmlFor="dropzone-file"
                                className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50"
                              >
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                  <svg
                                    className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400"
                                    aria-hidden="true"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 20 16"
                                  >
                                    <path
                                      stroke="currentColor"
                                      stroke-linecap="round"
                                      stroke-linejoin="round"
                                      stroke-width="2"
                                      d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                                    />
                                  </svg>
                                  <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                                    <span className="font-semibold">
                                      Click to upload
                                    </span>{" "}
                                    or drag and drop
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    SVG, PNG, JPG or GIF (MAX. 800x400px)
                                  </p>
                                </div>
                                <input
                                  id="dropzone-file"
                                  type="file"
                                  className="hidden"
                                  onChange={handleEditRoleImageChange}
                                />
                              </label>
                            )}
                            <label
                              htmlFor="dropzone-file"
                              className="px-[20px] py-[10px] bg-black text-white text-[18px] rounded flex items-center gap-[10px] w-fit mx-auto"
                            >
                              <p>Change the image</p>
                              <input
                                id="dropzone-file"
                                type="file"
                                className="hidden"
                                onChange={handleEditRoleImageChange}
                              />
                            </label>
                          </div>
                        </div>

                        <DialogFooter>
                          <DialogClose asChild>
                            <button
                              name="add_task_cancel_button"
                              className="text-white bg-black font-semibold px-5 py-2 rounded-md"
                              onClick={() => {
                                handleEditRoleModalClose();
                              }}
                            >
                              Cancel
                            </button>
                          </DialogClose>

                          <button
                            name="add_role_submit_button"
                            className="px-[20px] py-[10px] bg-black text-white text-[18px] rounded flex items-center gap-[10px] w-fit mx-auto"
                            onClick={() => {
                              handleEditRole();
                            }}
                          >
                            Update
                          </button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

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

                {role.image ? (
                  <Image
                    src={role.image}
                    alt={role.name}
                    width={80}
                    height={80}
                    unoptimized={true}
                    className="w-12 h-auto aspect-square rounded-full object-cover"
                  />
                ) : (
                  <Avatar />
                )}

                {role.name}
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default Roles;
