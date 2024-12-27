"use client";

import Menubar from "@/components/Menubar/Menubar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { RootState } from "@/redux/store";
import { uploadFileToS3 } from "@/utils/AWS/FileUpload";
import { renderInstance } from "@/utils/Axios/RenderInstance";
import { errorMessage, successMessage } from "@/utils/Toastify/Messages";
import { Inventory } from "@/utils/Types/types";
import { Backdrop, CircularProgress } from "@mui/material";
import { Check, ChevronsUpDown } from "lucide-react";
import { useCookie } from "next-cookie";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useSelector } from "react-redux";

interface Translations {
  name: string;
  description: string;
  dragDropText: string;
  selectTractor: string;
  noTractorsAvailable: string;
  submit: string;
  imageUploading: string;
  creatingAttachment: string;
}

const NewAttachment = () => {
  const [activeLanguage, setActiveLanguage] = useState("en");
  const [selectedImage, setSelectedImage] = useState<File[]>([]);
  const [fetchingAttachments, setFetchingAttachments] = useState(false);
  const [tractorType, setTractorType] = useState("");
  const [tractorName, setTractorName] = useState("");
  const [allTractors, setAllTractors] = useState<Inventory[]>([]);
  const [fixedPrice, setFixedPrice] = useState(20)

  const [imageUploading, setImageUploading] = useState(false);
  const [creatingAttachment, setCreatingATtachment] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false)

  const [en_name, set_en_name] = useState("");
  const [en_description, set_en_description] = useState("");

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setSelectedImage((prevImages) => [...prevImages, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      "image/*": [],
    },
    multiple: true,
  });

  const { cookie } = useCookie();
  const access_token = cookie.get("access_token");

  const router = useRouter();

  const { language: locale } = useSelector(
    (root: RootState) => root.ActiveLanguage
  );

  function fetchAllTractors() {
    if (access_token) {
      setFetchingAttachments(true);
      renderInstance
        .get("/inventory")
        .then((res) => {
          if (res.status === 200) setAllTractors(res.data);
        })
        .catch((err) => {
          errorMessage("Error in fetching inventory lists");
        })
        .finally(() => {
          setFetchingAttachments(false);
        });
    } else errorMessage("Admin not logged in");
  }

  const allLanguages = [
    { name: "English", locale: "en" },
    { name: "Español", locale: "es" },
    { name: "Aymara", locale: "ay" },
    { name: "Quechua", locale: "qu" },
    { name: "Guarani", locale: "gn" },
  ];

  const translations: Record<string, Translations> = {
    en: {
      name: "Name",
      description: "Description",
      dragDropText: "Drag 'n' drop an image here, or click to select one",
      selectTractor: "Select tractor (optional)",
      noTractorsAvailable: "No tractors available",
      submit: "Submit",
      imageUploading: "Image uploading",
      creatingAttachment: "Creating attachment",
    },
    fr: {
      name: "Nom",
      description: "Description",
      dragDropText:
        "Glissez-déposez une image ici, ou cliquez pour en sélectionner une",
      selectTractor: "Sélectionnez un tracteur (facultatif)",
      noTractorsAvailable: "Aucun tracteur disponible",
      submit: "Soumettre",
      imageUploading: "Téléchargement d'image",
      creatingAttachment: "Création de pièce jointe",
    },
    pt: {
      name: "Nome",
      description: "Descrição",
      dragDropText:
        "Arraste e solte uma imagem aqui, ou clique para selecionar uma",
      selectTractor: "Selecione o trator (opcional)",
      noTractorsAvailable: "Nenhum trator disponível",
      submit: "Enviar",
      imageUploading: "Carregando imagem",
      creatingAttachment: "Criando anexo",
    },
    de: {
      name: "Name",
      description: "Beschreibung",
      dragDropText:
        "Ziehen Sie ein Bild hierher oder klicken Sie, um eines auszuwählen",
      selectTractor: "Traktor auswählen (optional)",
      noTractorsAvailable: "Keine Traktoren verfügbar",
      submit: "Einreichen",
      imageUploading: "Bild hochladen",
      creatingAttachment: "Anhang erstellen",
    },
    ko: {
      name: "이름",
      description: "설명",
      dragDropText: "이미지를 여기로 끌어다 놓거나 클릭하여 선택하세요",
      selectTractor: "트랙터 선택 (선택 사항)",
      noTractorsAvailable: "사용 가능한 트랙터 없음",
      submit: "제출",
      imageUploading: "이미지 업로드 중",
      creatingAttachment: "첨부 파일 생성 중",
    },
    es: {
      name: "Nombre",
      description: "Descripción",
      dragDropText:
        "Arrastra y suelta una imagen aquí, o haz clic para seleccionar una",
      selectTractor: "Seleccionar tractor (opcional)",
      noTractorsAvailable: "No hay tractores disponibles",
      submit: "Enviar",
      imageUploading: "Subiendo imagen",
      creatingAttachment: "Creando adjunto",
    },
    sv: {
      name: "Namn",
      description: "Beskrivning",
      dragDropText: "Dra och släpp en bild här, eller klicka för att välja en",
      selectTractor: "Välj traktor (valfritt)",
      noTractorsAvailable: "Inga traktorer tillgängliga",
      submit: "Skicka in",
      imageUploading: "Bild laddas upp",
      creatingAttachment: "Skapar bifogad fil",
    },
  };

  useEffect(() => {
    fetchAllTractors();
  }, []);

  async function handleAddTractor() {
    if (!en_name) {
      errorMessage("Attachment name can't be empty");
      return;
    }
    if (!en_description) {
      errorMessage("Attachment description can't be empty");
      return;
    }
    if (selectedImage.length === 0) {
      errorMessage("Upload atleast one image");
      return;
    }

    if (!fixedPrice) {
      errorMessage("Please give the fixed price")
      return
    }

    let tractorImages;

    if (selectedImage.length > 0) {
      setImageUploading(true);

      const uploadPromises = selectedImage.map(async (image) => {
        const buffer = Buffer.from(await image.arrayBuffer());
        return uploadFileToS3(buffer, image.name);
      });

      const fileUrls = await Promise.all(uploadPromises);
      tractorImages = fileUrls;

      setImageUploading(false);
    }

    const attachment = {
      name: en_name,
      description: en_description,
      tractorId: tractorType,
      images: tractorImages,
      fixed_price: `${fixedPrice}`
    };
    setCreatingATtachment(true);
    renderInstance
      .post("/attachment", attachment, {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      })
      .then((res) => {
        if (res.status === 201) {
          successMessage("Attachment added");
          router.push("/Attachments")
        }
      })
      .catch((err) => {
        if (
          err.response &&
          err.response.status === 409 &&
          err.response.data.message ===
          "Only admin users can create new attachments"
        ) {
          errorMessage("Only admin can add new attachments");
        } else if (
          err.response &&
          err.response.status === 409 &&
          err.response.data.message ===
          "A attachment with the same name is already exist"
        ) {
          errorMessage("Name already taken");
        } else if (
          err.response &&
          err.response.status === 409 &&
          err.response.data.message ===
          "Tractor with the given id does not present"
        ) {
          errorMessage("Selected tractor is not present");
        } else {
          errorMessage("Some error occurred");
        }
      })
      .finally(() => {
        setCreatingATtachment(false);
      });
  }

  return (
    <div className="w-full py-10 px-4 flex flex-col gap-5 items-center">
      <Menubar pagename={"New attachment"} />

      <Backdrop
        sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={fetchingAttachments || imageUploading || creatingAttachment}
      >
        {fetchingAttachments && <CircularProgress />}

        {imageUploading && (
          <p>
            {translations[locale]?.imageUploading ||
              translations.en?.imageUploading}
          </p>
        )}

        {creatingAttachment && (
          <p>
            {translations[locale]?.creatingAttachment ||
              translations.en?.creatingAttachment}
          </p>
        )}
      </Backdrop>

      <div className="w-full flex flex-wrap gap-5 items-center justify-center">
        {allLanguages.map((details, index) => {
          return (
            <div
              key={index}
              className={`text-xl font-medium px-4 py-2 transition border border-t-0 border-l-0 border-r-0 border-purple-500 ${details.locale === activeLanguage
                ? "border-b-4 text-primaryColor"
                : "border-b-0"
                } cursor-pointer`}
              onClick={() => {
                setActiveLanguage(details.locale);
              }}
            >
              {details.name}
            </div>
          );
        })}
      </div>

      <Card className="max-w-[600px] w-full p-5">

        <CardContent className="max-w-[600px] w-full space-y-4">

          {activeLanguage === "en" && (
            <div className="w-full flex flex-col items-center gap-[20px] max-w-[600px] mx-auto">

              <div className="space-y-2 w-full">
                <Label htmlFor="attachment_name">Attachment name</Label>
                <Input
                  id="attachment_name"
                  className="w-full"
                  placeholder='e.g - cultivator'
                  value={en_name}
                  onChange={(e) => {
                    set_en_name(e.target.value);
                  }} />
              </div>

              <div className="grid w-full gap-1.5">
                <Label htmlFor="message">Attachment description</Label>
                <Textarea
                  placeholder="Type your description here."
                  id="message"
                  className="resize-none w-full"
                  value={en_description}
                  onChange={(e) => {
                    set_en_description(e.target.value);
                  }} />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-[4px] w-full">
            <Label>Fixed price (in dollar $)</Label>
            <Input
              type="number"
              value={fixedPrice}
              onChange={(e) => {
                setFixedPrice(parseInt(e.target.value));
              }}
            />
          </div>

          {activeLanguage === "es" && (
            <div className="w-full flex flex-col items-center gap-[20px] max-w-[600px] mx-auto">

              <div className="space-y-2 w-full">
                <Label htmlFor="attachment_name">Attachment name</Label>
                <Input
                  id="attachment_name"
                  className="w-full"
                  placeholder='e.g - cultivator'
                  value={en_name}
                  onChange={(e) => {
                    set_en_name(e.target.value);
                  }} />
              </div>

              <div className="grid w-full gap-1.5">
                <Label htmlFor="message">Attachment description</Label>
                <Textarea
                  placeholder="Type your description here."
                  id="message"
                  className="resize-none w-full"
                  value={en_description}
                  onChange={(e) => {
                    set_en_description(e.target.value);
                  }} />
              </div>
            </div>
          )}

          {activeLanguage === "ay" && (
            <div className="w-full flex flex-col items-center gap-[20px] max-w-[600px] mx-auto">

              <div className="space-y-2 w-full">
                <Label htmlFor="attachment_name">Attachment name</Label>
                <Input
                  id="attachment_name"
                  className="w-full"
                  placeholder='e.g - cultivator'
                  value={en_name}
                  onChange={(e) => {
                    set_en_name(e.target.value);
                  }} />
              </div>

              <div className="grid w-full gap-1.5">
                <Label htmlFor="message">Attachment description</Label>
                <Textarea
                  placeholder="Type your description here."
                  id="message"
                  className="resize-none w-full"
                  value={en_description}
                  onChange={(e) => {
                    set_en_description(e.target.value);
                  }} />
              </div>
            </div>
          )}

          {activeLanguage === "qu" && (
            <div className="w-full flex flex-col items-center gap-[20px] max-w-[600px] mx-auto">

              <div className="space-y-2 w-full">
                <Label htmlFor="attachment_name">Attachment name</Label>
                <Input
                  id="attachment_name"
                  className="w-full"
                  placeholder='e.g - cultivator'
                  value={en_name}
                  onChange={(e) => {
                    set_en_name(e.target.value);
                  }} />
              </div>

              <div className="grid w-full gap-1.5">
                <Label htmlFor="message">Attachment description</Label>
                <Textarea
                  placeholder="Type your description here."
                  id="message"
                  className="resize-none w-full"
                  value={en_description}
                  onChange={(e) => {
                    set_en_description(e.target.value);
                  }} />
              </div>
            </div>
          )}

          {activeLanguage === "gn" && (
            <div className="w-full flex flex-col items-center gap-[20px] max-w-[600px] mx-auto">

              <div className="space-y-2 w-full">
                <Label htmlFor="attachment_name">Attachment name</Label>
                <Input
                  id="attachment_name"
                  className="w-full"
                  placeholder='e.g - cultivator'
                  value={en_name}
                  onChange={(e) => {
                    set_en_name(e.target.value);
                  }} />
              </div>

              <div className="grid w-full gap-1.5">
                <Label htmlFor="message">Attachment description</Label>
                <Textarea
                  placeholder="Type your description here."
                  id="message"
                  className="resize-none w-full"
                  value={en_description}
                  onChange={(e) => {
                    set_en_description(e.target.value);
                  }} />
              </div>
            </div>
          )}

          <div className="max-w-[600px] mx-auto">
            <div
              {...getRootProps()}
              className="dropzone text-center border-dashed border-2 border-gray-300 p-6 rounded-md"
            >
              <input {...getInputProps()} />
              <p className="text-gray-600">
                Drag 'n' drop an image here, or click to select one
                {translations[locale]?.dragDropText ||
                  translations.en?.dragDropText}
              </p>
            </div>
          </div>

          <div className="w-full my-[4px] flex items-center flex-wrap gap-[20px] max-w-[600px] mx-auto">
            {selectedImage.length > 0 &&
              selectedImage.map((image, index) => {
                return (
                  <Image
                    alt="image"
                    src={URL.createObjectURL(image)}
                    key={index}
                    width={80}
                    height={80}
                    className="object-cover w-[80px] h-[80px] cursor-pointer rounded-md"
                  />
                );
              })}
          </div>

        </CardContent>

      </Card>

      <button
        name="submit_button"
        className="py-[10px] px-4 w-fit bg-black font-bold text-white rounded-md mx-auto"
        onClick={() => {
          handleAddTractor();
        }}
      >
        {translations[locale]?.submit || translations.en?.submit}
      </button>
    </div>
  );
};

export default NewAttachment;
