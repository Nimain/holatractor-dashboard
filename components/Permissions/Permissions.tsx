"use client";

import { renderInstance } from "@/utils/Axios/RenderInstance";
import { errorMessage, successMessage } from "@/utils/Toastify/Messages";
import { Role } from "@/utils/Types/types";
import { Backdrop, CircularProgress } from "@mui/material";
import { useCookie } from "next-cookie";
import Image from "next/image";
import { useState, useEffect } from "react";
import { allModuleList } from "./AllModule";

type PermissionType = "create" | "read" | "update" | "delete";

interface Module {
  name: string;
  create?: boolean;
  read?: boolean;
  update?: boolean;
  delete?: boolean;
}

interface ModuledRole {
  id: string;
  name: string;
  allowedModules: Module[];
}

const Permissions = () => {
  const [selectedRole, setSelectedRole] = useState<ModuledRole | undefined>(
    undefined
  );
  const [roles, setRoles] = useState<Role[]>([]);
  const [fetchingRoles, setFetchingRoles] = useState(false);

  const [loading, setLoading] = useState(false);

  const { cookie } = useCookie();
  const access_token = cookie.get("access_token");

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

  function handlePermissionChange(
    moduleName: string,
    permissionType: PermissionType,
    value: boolean
  ) {
    if (!selectedRole) return; // Ensure selectedRole is defined

    setSelectedRole((prevState) => {
      if (!prevState) return prevState; // Safety check

      const updatedModules = prevState.allowedModules.map((module) => {
        if (module.name === moduleName) {
          return { ...module, [permissionType]: value };
        }
        return module;
      });

      const moduleWithPermissions = updatedModules.find(
        (module) => module.name === moduleName
      );

      if (!moduleWithPermissions) {
        updatedModules.push({ name: moduleName, [permissionType]: value });
      } else {
        if (
          !moduleWithPermissions.create &&
          !moduleWithPermissions.read &&
          !moduleWithPermissions.update &&
          !moduleWithPermissions.delete
        ) {
          return {
            ...prevState,
            allowedModules: updatedModules.filter(
              (module) => module.name !== moduleName
            ),
          };
        }
      }

      return { ...prevState, allowedModules: updatedModules };
    });
  }

  function handleUpdateRole() {
    setLoading(true);

    if (selectedRole) {
      renderInstance
        .patch(`/role/${selectedRole.id}`, selectedRole, {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        })
        .then(() => {
          successMessage("Role updated successfully");
          fetchAllRoles(); // Refresh the roles list
        })
        .catch((err) => {
          errorMessage("Error updating role");
        })
        .finally(() => {
          setLoading(false);
        });
    } else errorMessage("Please select a role to modify");
  }

  useEffect(() => {
    fetchAllRoles();
  }, []);

  return (
    <div className="p-[30px] rounded-xl bg-white w-full text-[18px]">
      <p>Please select the role you want to modify:</p>

      <div className="grid grid-cols-4 gap-8 w-full mt-[20px]">
        {fetchingRoles ? (
          <p>Fetching roles</p>
        ) : roles.length === 0 ? (
          <p>No roles found</p>
        ) : (
          roles.map((role, index) => (
            <div
              className={`${
                selectedRole?.id === role.id ? "bg-blue-100" : "bg-white"
              } ${role.name === "admin" && "hidden"} border flex-1 flex items-center gap-2 w-full py-5 px-2 shadow-xl rounded-md text-[18px] cursor-pointer relative`}
              onClick={() => setSelectedRole(role)}
              key={index}
            >
              {role.image && (
                <Image
                  src={role.image}
                  alt={role.name}
                  width={80}
                  height={80}
                  unoptimized={true}
                  className="w-12 h-auto aspect-square rounded-full object-cover"
                />
              )}
              {role.name}
            </div>
          ))
        )}
      </div>

      {selectedRole && (
        <div className="py-5 w-full text-[18px]">
          {allModuleList.map((moduleListItem, index) => {
  const modulePermissions: Partial<Record<PermissionType, boolean>> = selectedRole?.allowedModules.find(mod => mod.name === moduleListItem) || {};

  return (
    <div className="flex items-center gap-[40px]" key={index}>
      <div className="font-[600] w-[180px] whitespace-nowrap">{moduleListItem} module:</div>
      <div className="flex items-center gap-[20px]">
        {(['create', 'read', 'update', 'delete'] as PermissionType[]).map(permission => (
          <div className="flex items-center gap-[8px]" key={permission}>
            <input
              type="checkbox"
              checked={modulePermissions[permission] || false}
              onChange={(e) =>
                handlePermissionChange(
                  moduleListItem,
                  permission,
                  e.target.checked
                )
              }
              className="accent-green-400"
            />
            <p>{permission.charAt(0).toUpperCase() + permission.slice(1)}</p>
          </div>
        ))}
      </div>
    </div>
  );
})}

          <button
            name="add__new_role"
            className="px-[20px] py-[10px] bg-black text-white text-[18px] rounded flex items-center gap-[10px] mt-5"
            onClick={handleUpdateRole}
          >
            Update role
          </button>
        </div>
      )}

      <Backdrop
        sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading}
      >
        <CircularProgress />
      </Backdrop>
    </div>
  );
};

export default Permissions;
