import { useState } from "react";
import { X, Search, Radio, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { errorMessage, successMessage } from "@/utils/Toastify/Messages";
import { useDealerLanguage } from "@/context/DealerLanguageContext";

interface AddTractorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSuccess?: (tractorData: any) => void;
}

export default function AddTractorModal({
  isOpen,
  onClose,
  onAddSuccess,
}: AddTractorModalProps) {
  const { t } = useDealerLanguage();
  const [model, setModel] = useState("");
  const [vin, setVin] = useState("");
  const [acquisitionDate, setAcquisitionDate] = useState("");
  const [engineHours, setEngineHours] = useState("");
  const [imei, setImei] = useState("");
  const [region, setRegion] = useState("South West (SW)");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!model) {
      errorMessage("Please select or enter a tractor model");
      return;
    }

    if (imei && imei.trim().length > 20) {
      errorMessage("IMEI number must be up to 20 digits");
      return;
    }

    setSubmitting(true);

    setTimeout(() => {
      setSubmitting(false);
      successMessage("Tractor added to fleet successfully!");
      if (onAddSuccess) {
        onAddSuccess({
          model,
          vin,
          acquisitionDate,
          engineHours,
          imei,
          region,
        });
      }
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#790000]/10 text-[#790000] flex items-center justify-center font-bold">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {t("addNewTractorTitle")}
              </h3>
              <p className="text-xs text-slate-500">
                Enter equipment specs and telemetry device configuration
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          {/* Tractor Model Searchable Select */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              {t("tractorModel")}
            </label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#790000]/30 focus:border-[#790000] transition-all appearance-none"
                required
              >
                <option value="">{t("searchModelPlaceholder")}</option>
                <option value="John Deere 8R Series">John Deere 8R Series</option>
                <option value="Case IH Magnum Series">Case IH Magnum Series</option>
                <option value="Mahindra 6000 Series">Mahindra 6000 Series</option>
                <option value="Massey Ferguson 8S">Massey Ferguson 8S</option>
                <option value="New Holland 3032">New Holland 3032</option>
              </select>
            </div>
          </div>

          {/* VIN & Acquisition Date Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                {t("vinSerial")}
              </label>
              <Input
                type="text"
                value={vin}
                onChange={(e) => setVin(e.target.value)}
                placeholder="e.g. 1RW8R410PCX9..."
                className="text-xs bg-slate-50 border-slate-200 rounded-xl h-10 focus:border-[#790000]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                {t("acquisitionDate")}
              </label>
              <Input
                type="date"
                value={acquisitionDate}
                onChange={(e) => setAcquisitionDate(e.target.value)}
                className="text-xs bg-slate-50 border-slate-200 rounded-xl h-10 focus:border-[#790000]"
              />
            </div>
          </div>

          {/* Engine Hours */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              {t("engineHours")}
            </label>
            <Input
              type="number"
              value={engineHours}
              onChange={(e) => setEngineHours(e.target.value)}
              placeholder="0"
              className="text-xs bg-slate-50 border-slate-200 rounded-xl h-10 focus:border-[#790000]"
            />
          </div>

          {/* GPS Telematics Section */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#790000]">
              <Radio className="w-4 h-4" />
              <span>{t("gpsTelematics")}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  {t("imeiNumber")}
                </label>
                <Input
                  type="text"
                  value={imei}
                  onChange={(e) => setImei(e.target.value)}
                  maxLength={20}
                  placeholder="15-20 digit IMEI"
                  className="text-xs bg-white border-slate-200 rounded-lg h-9 focus:border-[#790000]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  {t("region")}
                </label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#790000] h-9"
                >
                  <option value="South West (SW)">South West (SW)</option>
                  <option value="North East (NE)">North East (NE)</option>
                  <option value="Midwest (MW)">Midwest (MW)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
              className="text-xs font-bold text-slate-600 border-slate-300 rounded-xl px-5"
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-[#790000] hover:bg-[#570000] text-white font-extrabold text-xs px-6 py-2.5 rounded-xl shadow-md flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Adding...
                </>
              ) : (
                t("addToFleet")
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
