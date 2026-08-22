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
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm rounded-xl flex items-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
              onClick={() => {
                setAddNewRole(true);
              }}
            >
              <AddIcon fontSize="small" />
              Add new role
            </button>
          </DialogTrigger>

          <DialogContent
            className="bg-white max-w-[480px] p-0 rounded-2xl border border-gray-100 shadow-2xl overflow-hidden"
          >
            <div className="bg-slate-900 p-6 text-white relative">
              <p className="text-xs uppercase tracking-wider font-semibold text-emerald-400 mb-1">Access Control</p>
              <h2 className="text-xl font-bold">Create New Role</h2>
              <p className="text-xs text-slate-300 mt-1">Define permissions and access boundaries for this role.</p>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label htmlFor="new_role_name" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Role Name *
                </label>
                <input
                  type="text"
                  name="new_role_name"
                  id="new_role_name"
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
                  placeholder="e.g. Supervisor, Inspector, Dispatcher"
                  value={addNewRoleName}
                  onChange={(e) => {
                    setAddNewRoleName(e.target.value);
                  }}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Role Icon / Badge Image (Optional)
                </label>
                {image ? (
                  <div className="relative w-full h-40 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center p-3">
                    <Image
                      src={URL.createObjectURL(image)}
                      alt="Role Image"
                      width={100}
                      height={100}
                      className="object-cover rounded-xl shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setImage(null)}
                      className="absolute top-3 right-3 text-xs bg-red-100 text-red-600 hover:bg-red-200 px-2.5 py-1 rounded-lg font-medium transition-all"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <label
                    htmlFor="dropzone-file"
                    className="flex flex-col items-center justify-center w-full h-36 border-2 border-slate-200 border-dashed rounded-xl cursor-pointer bg-slate-50/50 hover:bg-slate-50 hover:border-emerald-400 transition-all p-4 text-center"
                  >
                    <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
                      <AddIcon />
                    </div>
                    <p className="text-xs font-medium text-slate-700">
                      <span className="text-emerald-600 font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">PNG, JPG, SVG up to 5MB</p>
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

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button
                name="add_task_cancel_button"
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-xl transition-all"
                onClick={() => {
                  setAddNewRole(false);
                }}
              >
                Cancel
              </button>

              <button
                name="add_role_submit_button"
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
                onClick={() => {
                  handleCreateRole();
                }}
              >
                Create Role
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-4 gap-8 w-full">
        {fetchingRoles ? (
          <p>Fetching roles</p>
        ) : (
          roles.length === 1 && <p>No roles present</p>
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
                  <div className="absolute top-0 right-[-20px] bg-white flex flex-col text-[14px] gap-[4px] p-[10px] shadow-md rounded-md z-10">
                    <Dialog open={editARole} onOpenChange={setEditARole}>
                      <DialogTrigger asChild>
                        <button
                          name="edit_specific_role"
                          className="px-3 py-1.5 text-xs text-left hover:bg-slate-50 rounded font-medium text-slate-700"
                          onClick={() => {
                            handleEditRoleModalOpen(
                              role.name,
                              role.image as string,
                              role.id
                            );
                          }}
                        >
                          Edit Role
                        </button>
                      </DialogTrigger>

                      <DialogContent
                        className="bg-white max-w-[480px] p-0 rounded-2xl border border-gray-100 shadow-2xl overflow-hidden"
                      >
                        <div className="bg-slate-900 p-6 text-white relative">
                          <p className="text-xs uppercase tracking-wider font-semibold text-emerald-400 mb-1">Configuration</p>
                          <h2 className="text-xl font-bold">Update Role Details</h2>
                          <p className="text-xs text-slate-300 mt-1">Modify name and iconography for this role.</p>
                        </div>

                        <div className="p-6 space-y-5">
                          <div>
                            <label
                              htmlFor="edit_role_name"
                              className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2"
                            >
                              Role Name *
                            </label>
                            <input
                              type="text"
                              name="edit_role_name"
                              id="edit_role_name"
                              className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
                              placeholder="Enter the role name"
                              value={editRoleName}
                              onChange={(e) => {
                                setEditRoleName(e.target.value);
                              }}
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                              Role Badge Image
                            </label>
                            {editRoleImage ? (
                              <div className="relative w-full h-40 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center p-3">
                                <Image
                                  src={
                                    typeof editRoleImage === "string"
                                      ? editRoleImage
                                      : URL.createObjectURL(editRoleImage)
                                  }
                                  alt="Role Image"
                                  width={100}
                                  height={100}
                                  className="object-cover rounded-xl shadow-sm"
                                />
                                <button
                                  type="button"
                                  onClick={() => setEditRoleImage(null)}
                                  className="absolute top-3 right-3 text-xs bg-red-100 text-red-600 hover:bg-red-200 px-2.5 py-1 rounded-lg font-medium transition-all"
                                >
                                  Change Image
                                </button>
                              </div>
                            ) : (
                              <label
                                htmlFor="edit-dropzone-file"
                                className="flex flex-col items-center justify-center w-full h-36 border-2 border-slate-200 border-dashed rounded-xl cursor-pointer bg-slate-50/50 hover:bg-slate-50 hover:border-emerald-400 transition-all p-4 text-center"
                              >
                                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
                                  <AddIcon />
                                </div>
                                <p className="text-xs font-medium text-slate-700">
                                  <span className="text-emerald-600 font-semibold">Click to upload</span> or drag and drop
                                </p>
                                <p className="text-[11px] text-slate-400 mt-0.5">PNG, JPG, SVG up to 5MB</p>
                                <input
                                  id="edit-dropzone-file"
                                  type="file"
                                  className="hidden"
                                  onChange={handleEditRoleImageChange}
                                />
                              </label>
                            )}
                          </div>
                        </div>

                        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                          <button
                            type="button"
                            className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-xl transition-all"
                            onClick={handleEditRoleModalClose}
                          >
                            Cancel
                          </button>

                          <button
                            type="button"
                            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
                            onClick={handleEditRole}
                          >
                            Save Changes
                          </button>
                        </div>
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
