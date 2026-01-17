"use client";

import { useEffect, useState } from "react";
import { Trash2, Edit2, Eye, Plus, X } from "lucide-react";
import { FarmCategory } from "@/utils/Types/types";
import { renderInstance } from "@/utils/Axios/RenderInstance";
import { errorMessage, successMessage } from "@/utils/Toastify/Messages";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";

const FarmCategoriesSection = () => {
  const [categories, setCategories] = useState<FarmCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [mailHover, setMailHover] = useState(-1);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<FarmCategory | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    name: "",
    icon: "",
    description: ""
  });

  const { language: locale } = useSelector(
    (root: RootState) => root.ActiveLanguage
  );

  const getTranslation = (locale: string, translations: any) => {
    return translations[locale] || translations["en"];
  };

  // ✅ Check if user is authenticated
  const checkAuth = (): boolean => {
    const token = localStorage.getItem("adminToken") || localStorage.getItem("token");
    return !!token;
  };

  // ✅ FIXED: Get auth headers with proper error handling
  const getAuthHeaders = () => {
    const token = localStorage.getItem("adminToken") || localStorage.getItem("token");
    return {
      headers: {
        Authorization: `Bearer ${token || ""}`,
      },
    };
  };

  // ✅ Handle authentication check before actions
  const handleAuthCheck = (action: () => void) => {
    if (!checkAuth()) {
      errorMessage("Please login to perform this action");
      return;
    }
    action();
  };

  // ✅ REAL API: Fetch all categories
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await renderInstance.get("/farm/categories");
      const sortedCategories = response.data.sort((a: FarmCategory, b: FarmCategory) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      setCategories(sortedCategories);
    } catch (error: any) {
      console.error("Fetch error:", error);
      if (error.response?.status === 401) {
        errorMessage("Session expired. Please login again.");
      } else {
        errorMessage("Error fetching categories");
      }
    } finally {
      setLoading(false);
    }
  };

  // ✅ REAL API: Create category with AUTH
  const handleCreate = async () => {
    if (!formData.name.trim()) {
      errorMessage("Category name is required");
      return;
    }

    try {
      const payload: any = { name: formData.name.trim() };
      if (formData.icon.trim()) payload.icon = formData.icon.trim();
      if (formData.description.trim()) payload.description = formData.description.trim();

      await renderInstance.post("/farm/categories", payload, getAuthHeaders());
      
      successMessage("Category created successfully");
      setIsCreateDialogOpen(false);
      setFormData({ name: "", icon: "", description: "" });
      fetchCategories();
    } catch (error: any) {
      console.error("Create error:", error);
      if (error.response?.status === 401) {
        errorMessage("Session expired. Please login again.");
      } else {
        const message = error.response?.data?.message || "Failed to create category";
        errorMessage(message);
      }
    }
  };

  // ✅ FIXED: Update category with AUTH
  const handleUpdate = async () => {
    if (!selectedCategory || !formData.name.trim()) {
      errorMessage("Category name is required");
      return;
    }

    try {
      const payload: any = {};
      
      if (formData.name.trim() !== selectedCategory.name) {
        payload.name = formData.name.trim();
      }
      
      const currentIcon = selectedCategory.icon || "";
      const newIcon = formData.icon.trim();
      if (newIcon !== currentIcon) {
        payload.icon = newIcon || null;
      }
      
      const currentDescription = selectedCategory.description || "";
      const newDescription = formData.description.trim();
      if (newDescription !== currentDescription) {
        payload.description = newDescription || null;
      }

      if (Object.keys(payload).length === 0) {
        errorMessage("No changes detected");
        return;
      }
      
      await renderInstance.patch(
        `/farm/categories/${selectedCategory.id}`, 
        payload,
        getAuthHeaders()
      );
      
      successMessage("Category updated successfully");
      setIsEditDialogOpen(false);
      setSelectedCategory(null);
      setFormData({ name: "", icon: "", description: "" });
      fetchCategories();
    } catch (error: any) {
      console.error("Update error:", error);
      if (error.response?.status === 401) {
        errorMessage("Session expired. Please login again.");
      } else {
        const message = error.response?.data?.message || "Failed to update category";
        errorMessage(message);
      }
    }
  };

  // ✅ FIXED: Delete category with AUTH
  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this category? This will fail if any farm items are using this category.")) {
      return;
    }
    
    try {
      await renderInstance.delete(
        `/farm/categories/${id}`,
        getAuthHeaders()
      );
      
      successMessage("Category deleted successfully");
      fetchCategories();
    } catch (error: any) {
      console.error("Delete error:", error);
      if (error.response?.status === 401) {
        errorMessage("Session expired. Please login again.");
      } else {
        const message = error.response?.data?.message || "Failed to delete category. It may be in use by farm items.";
        errorMessage(message);
      }
    }
  };

  useEffect(() => {
    // Check authentication on component mount
    setIsAuthenticated(checkAuth());
    fetchCategories();
  }, []);

  const formatDate = (date: string): string => {
    return new Date(date).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const handleMobileCategoryClick = (category: FarmCategory) => {
    setSelectedCategory(category);
    setIsViewDialogOpen(true);
  };

  return (
    <div className="mt-6 md:mt-10 px-4 md:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-5 md:mb-8 w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            {getTranslation(locale, {
              en: "Farm Categories Management",
              es: "Gestión de Categorías de Granja",
              ay: "Yapuchiri t'aqanaka",
              qu: "Chakra categorías",
              gn: "Ñemitỹ categoría"
            })}
          </h1>
          <p className="text-gray-600">
            {getTranslation(locale, {
              en: "Total categories:",
              es: "Categorías totales:",
              ay: "Taqpacha t'aqanaka:",
              qu: "Lliw categorías:",
              gn: "Opa categoría:"
            })}{" "}
            <span className="font-semibold text-gray-900">{categories.length}</span>
          </p>
        </div>

        <button
          onClick={() => handleAuthCheck(() => setIsCreateDialogOpen(true))}
          disabled={!isAuthenticated}
          className={`w-full sm:w-auto px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
            isAuthenticated 
              ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
          title={!isAuthenticated ? "Login required to create categories" : ""}
        >
          <Plus size={20} />
          {getTranslation(locale, {
            en: "New Category",
            es: "Nueva Categoría",
            ay: "Machaqa t'aqa",
            qu: "Musuq categoría",
            gn: "Categoría pyahu"
          })}
        </button>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-white rounded-lg shadow overflow-hidden">
        {/* Table Header */}
        <div className="bg-gray-100 p-4 grid grid-cols-7 gap-4 font-semibold text-sm">
          <div className="flex items-center gap-2">
            <span>ID</span>
          </div>
          <div className="flex items-center gap-2">
            {getTranslation(locale, {
              en: "Name",
              es: "Nombre",
              ay: "Suti",
              qu: "Suti",
              gn: "Téra"
            })}
          </div>
          <div className="flex items-center gap-2">
            {getTranslation(locale, {
              en: "Icon",
              es: "Ícono",
              ay: "Uñacht'a",
              qu: "Siq'i",
              gn: "Ta'ãnga"
            })}
          </div>
          <div className="flex items-center gap-2">
            {getTranslation(locale, {
              en: "Items",
              es: "Artículos",
              ay: "Yänaka",
              qu: "Imakuna",
              gn: "Mba'e"
            })}
          </div>
          <div className="flex items-center gap-2">
            {getTranslation(locale, {
              en: "Created",
              es: "Creado",
              ay: "Lurañata",
              qu: "Rurasqa",
              gn: "Ojejapo"
            })}
          </div>
          <div className="flex items-center gap-2">
            {getTranslation(locale, {
              en: "Updated",
              es: "Actualizado",
              ay: "Qillqata",
              qu: "Musuqchay",
              gn: "Guarã"
            })}
          </div>
          <div className="flex items-center justify-center gap-2">
            {getTranslation(locale, {
              en: "Actions",
              es: "Acciones",
              ay: "Lurawinaka",
              qu: "Ruwaykuna",
              gn: "Tembiaporã"
            })}
          </div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-gray-200">
          {loading ? (
            <div className="p-8 text-center text-gray-500">
              {getTranslation(locale, {
                en: "Loading categories...",
                es: "Cargando categorías...",
                ay: "T'aqanaka apsuña...",
                qu: "Categorías apsaykuspa...",
                gn: "Omba'apo categoría..."
              })}
            </div>
          ) : categories.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {getTranslation(locale, {
                en: "No categories found. Create your first category!",
                es: "No se encontraron categorías. ¡Crea tu primera categoría!",
                ay: "Janiw t'aqanaka jikxatati. ¡Nayrïr t'aqa luraña!",
                qu: "Mana categorías tarisqachu. ¡Ñawpaq categoría ruray!",
                gn: "Ndojejuhúi categoría. ¡Emoheñói peteĩha!"
              })}
            </div>
          ) : (
            categories.map((category, index) => (
              <div
                key={category.id}
                className="p-4 grid grid-cols-7 gap-4 items-center hover:bg-gray-50 transition-colors"
                onMouseEnter={() => setMailHover(index)}
                onMouseLeave={() => setMailHover(-1)}
              >
                <div className="text-sm text-gray-600">#{index + 1}</div>
                <div className="font-medium truncate">{category.name}</div>
                <div className="text-2xl">{category.icon || "📦"}</div>
                <div className="text-sm">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                    {category._count.farmItems} items
                  </span>
                </div>
                <div className="text-sm text-gray-600">{formatDate(category.createdAt)}</div>
                <div className="text-sm text-gray-600">{formatDate(category.updatedAt)}</div>
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedCategory(category);
                      setIsViewDialogOpen(true);
                    }}
                    className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                    title="View"
                  >
                    <Eye size={18} className="text-blue-600" />
                  </button>
                  <button
                    onClick={() => handleAuthCheck(() => {
                      setSelectedCategory(category);
                      setFormData({
                        name: category.name,
                        icon: category.icon || "",
                        description: category.description || ""
                      });
                      setIsEditDialogOpen(true);
                    })}
                    disabled={!isAuthenticated}
                    className={`p-2 rounded-lg transition-colors ${
                      isAuthenticated 
                        ? 'hover:bg-yellow-100 cursor-pointer' 
                        : 'opacity-50 cursor-not-allowed'
                    }`}
                    title={!isAuthenticated ? "Login required" : "Edit"}
                  >
                    <Edit2 size={18} className="text-yellow-600" />
                  </button>
                  <button
                    onClick={() => handleAuthCheck(() => handleDelete(category.id))}
                    disabled={!isAuthenticated}
                    className={`p-2 rounded-lg transition-colors ${
                      isAuthenticated 
                        ? 'hover:bg-red-100 cursor-pointer' 
                        : 'opacity-50 cursor-not-allowed'
                    }`}
                    title={!isAuthenticated ? "Login required" : "Delete"}
                  >
                    <Trash2 size={18} className="text-red-600" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-full p-8 text-center text-gray-500">
            {getTranslation(locale, {
              en: "Loading categories...",
              es: "Cargando categorías...",
              ay: "T'aqanaka apsuña...",
              qu: "Categorías apsaykuspa...",
              gn: "Omba'apo categoría..."
            })}
          </div>
        ) : categories.length === 0 ? (
          <div className="col-span-full p-8 text-center text-gray-500">
            {getTranslation(locale, {
              en: "No categories found. Create your first category!",
              es: "No se encontraron categorías. ¡Crea tu primera categoría!",
              ay: "Janiw t'aqanaka jikxatati. ¡Nayrïr t'aqa luraña!",
              qu: "Mana categorías tarisqachu. ¡Ñawpaq categoría ruray!",
              gn: "Ndojejuhúi categoría. ¡Emoheñói peteĩha!"
            })}
          </div>
        ) : (
          categories.map((category, index) => (
            <div 
              key={category.id} 
              className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-all cursor-pointer active:scale-[0.98]"
              onClick={() => handleMobileCategoryClick(category)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{category.icon || "📦"}</div>
                  <div>
                    <h3 className="font-semibold text-lg">{category.name}</h3>
                    <p className="text-sm text-gray-600">#{index + 1}</p>
                  </div>
                </div>
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                  {category._count.farmItems} items
                </span>
              </div>

              {category.description && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{category.description}</p>
              )}

              <div className="space-y-2 text-sm mb-4 pb-4 border-b border-gray-200">
                <div className="flex justify-between">
                  <span className="text-gray-600">Created:</span>
                  <span className="text-gray-900 text-xs">{formatDate(category.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Updated:</span>
                  <span className="text-gray-900 text-xs">{formatDate(category.updatedAt)}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedCategory(category);
                    setIsViewDialogOpen(true);
                  }}
                  className="flex-1 px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Eye size={16} />
                  View
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAuthCheck(() => {
                      setSelectedCategory(category);
                      setFormData({
                        name: category.name,
                        icon: category.icon || "",
                        description: category.description || ""
                      });
                      setIsEditDialogOpen(true);
                    });
                  }}
                  disabled={!isAuthenticated}
                  className={`flex-1 px-3 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                    isAuthenticated
                      ? 'bg-yellow-100 hover:bg-yellow-200 text-yellow-700 cursor-pointer'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Edit2 size={16} />
                  Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAuthCheck(() => handleDelete(category.id));
                  }}
                  disabled={!isAuthenticated}
                  className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                    isAuthenticated
                      ? 'bg-red-100 hover:bg-red-200 text-red-700 cursor-pointer'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Dialog */}
      {isCreateDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">
                {getTranslation(locale, {
                  en: "Create New Category",
                  es: "Crear Nueva Categoría",
                  ay: "Machaqa t'aqa luraña",
                  qu: "Musuq categoría ruray",
                  gn: "Emoheñói categoría pyahu"
                })}
              </h2>
              <button
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  setFormData({ name: "", icon: "", description: "" });
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  {getTranslation(locale, {
                    en: "Name *",
                    es: "Nombre *",
                    ay: "Suti *",
                    qu: "Suti *",
                    gn: "Téra *"
                  })}
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Crops"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {getTranslation(locale, {
                    en: "Icon (emoji or URL)",
                    es: "Ícono (emoji o URL)",
                    ay: "Uñacht'a (emoji jan URL)",
                    qu: "Siq'i (emoji utaq URL)",
                    gn: "Ta'ãnga (emoji térã URL)"
                  })}
                </label>
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="🌾 or https://..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {getTranslation(locale, {
                    en: "Description",
                    es: "Descripción",
                    ay: "Qhanañchawi",
                    qu: "Sut'inchay",
                    gn: "Ñemombeupa"
                  })}
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Brief description..."
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  setFormData({ name: "", icon: "", description: "" });
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {getTranslation(locale, {
                  en: "Cancel",
                  es: "Cancelar",
                  ay: "Janiw munañäkiti",
                  qu: "Ama nisqa",
                  gn: "Ani"
                })}
              </button>
              <button
                onClick={handleCreate}
                disabled={!formData.name.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {getTranslation(locale, {
                  en: "Create",
                  es: "Crear",
                  ay: "Luraña",
                  qu: "Ruray",
                  gn: "Moheñói"
                })}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      {isEditDialogOpen && selectedCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">
                {getTranslation(locale, {
                  en: "Edit Category",
                  es: "Editar Categoría",
                  ay: "T'aqa qillqañaña",
                  qu: "Categoría allichay",
                  gn: "Guarã categoría"
                })}
              </h2>
              <button
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setSelectedCategory(null);
                  setFormData({ name: "", icon: "", description: "" });
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  {getTranslation(locale, {
                    en: "Name *",
                    es: "Nombre *",
                    ay: "Suti *",
                    qu: "Suti *",
                    gn: "Téra *"
                  })}
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {getTranslation(locale, {
                    en: "Icon",
                    es: "Ícono",
                    ay: "Uñacht'a",
                    qu: "Siq'i",
                    gn: "Ta'ãnga"
                  })}
                </label>
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {getTranslation(locale, {
                    en: "Description",
                    es: "Descripción",
                    ay: "Qhanañchawi",
                    qu: "Sut'inchay",
                    gn: "Ñemombeupa"
                  })}
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setSelectedCategory(null);
                  setFormData({ name: "", icon: "", description: "" });
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {getTranslation(locale, {
                  en: "Cancel",
                  es: "Cancelar",
                  ay: "Janiw munañäkiti",
                  qu: "Ama nisqa",
                  gn: "Ani"
                })}
              </button>
              <button
                onClick={handleUpdate}
                disabled={!formData.name.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {getTranslation(locale, {
                  en: "Update",
                  es: "Actualizar",
                  ay: "Qillqañaña",
                  qu: "Musuqchay",
                  gn: "Guarã"
                })}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Dialog - Enhanced Mobile-Friendly Version */}
      {isViewDialogOpen && selectedCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 relative rounded-t-lg">
              <button 
                onClick={() => setIsViewDialogOpen(false)}
                className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full p-1 transition-colors"
              >
                <X size={24} />
              </button>
              
              <div className="flex items-center gap-4">
                <div className="text-5xl">{selectedCategory.icon || "📦"}</div>
                <div className="text-white">
                  <h2 className="text-2xl font-bold">{selectedCategory.name}</h2>
                  <p className="text-blue-100 text-sm">
                    {getTranslation(locale, {
                      en: "Slug:",
                      es: "Slug:",
                      ay: "Slug:",
                      qu: "Slug:",
                      gn: "Slug:"
                    })} {selectedCategory.slug}
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {selectedCategory.description && (
                <div className="bg-blue-50 rounded-lg p-4 mb-4">
                  <p className="text-gray-700">{selectedCategory.description}</p>
                </div>
              )}

              {/* Details Grid */}
              <div className="space-y-3">
                <div className="flex justify-between items-center border-b pb-3">
                  <span className="text-sm font-medium text-gray-600">
                    {getTranslation(locale, {
                      en: "Total Items:",
                      es: "Total de Artículos:",
                      ay: "Taqpacha yänaka:",
                      qu: "Lliw imakuna:",
                      gn: "Opa mba'e:"
                    })}
                  </span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-semibold">
                    {selectedCategory._count.farmItems}
                  </span>
                </div>

                <div className="flex justify-between border-b pb-3">
                  <span className="text-sm font-medium text-gray-600">
                    {getTranslation(locale, {
                      en: "Created:",
                      es: "Creado:",
                      ay: "Lurañata:",
                      qu: "Rurasqa:",
                      gn: "Ojejapo:"
                    })}
                  </span>
                  <span className="text-sm text-gray-900">{formatDate(selectedCategory.createdAt)}</span>
                </div>

                <div className="flex justify-between border-b pb-3">
                  <span className="text-sm font-medium text-gray-600">
                    {getTranslation(locale, {
                      en: "Updated:",
                      es: "Actualizado:",
                      ay: "Qillqata:",
                      qu: "Musuqchay:",
                      gn: "Guarã:"
                    })}
                  </span>
                  <span className="text-sm text-gray-900">{formatDate(selectedCategory.updatedAt)}</span>
                </div>

                <div className="flex justify-between pb-3">
                  <span className="text-sm font-medium text-gray-600">ID:</span>
                  <span className="text-xs font-mono text-gray-600 break-all">{selectedCategory.id}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => handleAuthCheck(() => {
                    setIsViewDialogOpen(false);
                    setFormData({
                      name: selectedCategory.name,
                      icon: selectedCategory.icon || "",
                      description: selectedCategory.description || ""
                    });
                    setIsEditDialogOpen(true);
                  })}
                  disabled={!isAuthenticated}
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                    isAuthenticated
                      ? 'bg-yellow-600 hover:bg-yellow-700 text-white cursor-pointer'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <Edit2 size={16} />
                  {getTranslation(locale, {
                    en: "Edit",
                    es: "Editar",
                    ay: "Qillqañaña",
                    qu: "Allichay",
                    gn: "Guarã"
                  })}
                </button>
                <button
                  onClick={() => setIsViewDialogOpen(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors"
                >
                  {getTranslation(locale, {
                    en: "Close",
                    es: "Cerrar",
                    ay: "Wist'aña",
                    qu: "Wichq'ay",
                    gn: "Mboty"
                  })}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FarmCategoriesSection;