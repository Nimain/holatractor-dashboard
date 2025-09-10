"use client";

import { useState } from "react";
import Menubar from "@/components/Menubar/Menubar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { errorMessage, successMessage } from "@/utils/Toastify/Messages";
import { renderInstance } from "@/utils/Axios/RenderInstance";
import { Backdrop } from "@mui/material";
import { RefreshCw } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

const NewCategory = () => {
  const [activeLanguage, setActiveLanguage] = useState("en");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    slug: "",
    image: "",
  });

  const router = useRouter();

  // Available languages
  const allLanguages = [
    { name: "English", locale: "en" },
    { name: "Español", locale: "es" },
  ];

  // Translations
  const translations = {
    en: {
      addCategory: "Add New Category",
      categoryName: "Category Name *",
      categoryNamePlaceholder: "Category Name (e.g., Agriculture)",
      slug: "URL Slug *",
      slugPlaceholder: "Auto-generated slug",
      regenerate: "Regenerate slug from name",
      urlWillBe: "URL will be:",
      imageUrl: "Image URL",
      imagePlaceholder: "Enter image URL",
      cancel: "Cancel",
      add: "Add Category",
      adding: "Adding...",
      checking: "Checking availability...",
    },
    es: {
      addCategory: "Agregar nueva categoría",
      categoryName: "Nombre de la categoría *",
      categoryNamePlaceholder: "Nombre de la categoría (ej., Agricultura)",
      slug: "URL Slug *",
      slugPlaceholder: "Slug autogenerado",
      regenerate: "Regenerar slug desde el nombre",
      urlWillBe: "La URL será:",
      imageUrl: "URL de la imagen",
      imagePlaceholder: "Ingrese la URL de la imagen",
      cancel: "Cancelar",
      add: "Agregar categoría",
      adding: "Agregando...",
      checking: "Verificando disponibilidad...",
    },
  };

  const currentTranslation =
    translations[activeLanguage as keyof typeof translations];

  // Function to generate slug
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setForm({
      ...form,
      name: newName,
      slug: generateSlug(newName),
    });
  };

  const handleRegenerateSlug = () => {
    if (!form.name.trim()) return;
    setForm({ ...form, slug: generateSlug(form.name) });
  };

  const handleAddCategory = async () => {
    if (!form.name || !form.slug) {
      errorMessage("Please fill all required fields");
      return;
    }

    const payload = {
      name: form.name,
      slug: form.slug,
      image: form.image,
    };

    setLoading(true);

    try {
      const res = await renderInstance.post("/category", payload);
      if (res.status === 201) {
        successMessage("Category added successfully");
        router.push("/categories"); // redirect after success
      }
    } catch (err) {
      errorMessage("Failed to add category");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full py-10 px-4 flex flex-col gap-5 items-center">
      <Menubar pagename={currentTranslation.addCategory} />

      {/* Language Toggle */}
      <div className="w-full flex flex-wrap gap-5 items-center justify-center">
        {allLanguages.map((details, index) => (
          <div
            key={index}
            className={`text-xl font-medium px-4 py-2 transition border border-t-0 border-l-0 border-r-0 border-purple-500 ${
              details.locale === activeLanguage
                ? "border-b-4 text-primaryColor"
                : "border-b-0"
            } cursor-pointer`}
            onClick={() => setActiveLanguage(details.locale)}
          >
            {details.name}
          </div>
        ))}
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg p-6 w-[400px] relative shadow">
        <h2 className="text-xl font-semibold mb-4">
          {currentTranslation.addCategory}
        </h2>

        <div className="flex flex-col gap-4">
          {/* Category Name */}
          <div>
            <Label className="block text-sm font-medium mb-1">
              {currentTranslation.categoryName}
            </Label>
            <Input
              type="text"
              placeholder={currentTranslation.categoryNamePlaceholder}
              value={form.name}
              onChange={handleNameChange}
              className="w-full"
            />
          </div>

          {/* Slug */}
          <div>
            <Label className="block text-sm font-medium mb-1">
              {currentTranslation.slug}{" "}
              <span className="text-xs text-gray-500 ml-1">
                ({currentTranslation.regenerate})
              </span>
            </Label>
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder={currentTranslation.slugPlaceholder}
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                className="flex-1 bg-gray-50"
                required
              />
              <button
                type="button"
                onClick={handleRegenerateSlug}
                disabled={!form.name.trim()}
                className="px-3 py-2 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                title={currentTranslation.regenerate}
              >
                <RefreshCw size={16} />
              </button>
            </div>
            {form.slug && (
              <p className="text-xs text-gray-500 mt-1">
                {currentTranslation.urlWillBe}{" "}
                <span className="font-mono bg-gray-100 px-1 rounded">
                  /{form.slug}
                </span>
              </p>
            )}
          </div>

          {/* Image URL */}
          <div>
            <Label className="block text-sm font-medium mb-1">
              {currentTranslation.imageUrl}
            </Label>
            <Input
              type="text"
              placeholder={currentTranslation.imagePlaceholder}
              value={form.image}
              onChange={(e) => setForm({ ...form, image: e.target.value })}
              className="w-full"
            />
            {form.image && (
              <Image
                src={form.image}
                alt="Preview"
                width={80}
                height={80}
                className="mt-2 w-20 h-20 object-cover rounded border"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            )}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 mt-6">
          <Button
            variant="outline"
            onClick={() => setForm({ name: "", slug: "", image: "" })}
            disabled={loading}
          >
            {currentTranslation.cancel}
          </Button>
          <Button
            onClick={handleAddCategory}
            disabled={loading}
            className="bg-black text-white hover:bg-gray-800"
          >
            {loading ? currentTranslation.adding : currentTranslation.add}
          </Button>
        </div>
      </div>

      {/* Loading */}
      <Backdrop
        sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading}
      >
        <p>{currentTranslation.adding}</p>
      </Backdrop>
    </div>
  );
};

export default NewCategory;
