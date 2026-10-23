"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Tractor,
  Users,
  Plus,
  Trash2,
  Droplets,
  Clock,
  Sparkles,
  Layers,
  Sprout,
  Wheat,
  Scissors,
  CheckCircle2,
  DollarSign,
  Zap,
} from "lucide-react";
import {
  TaskManagementService,
  TaskAssignment,
  AvailableTractor,
  AvailableOperator,
  COMPREHENSIVE_OPERATIONS,
  OperationItem,
} from "@/utils/TaskManagementService";
import { detectUserCurrency } from "@/utils/currency/currencyService";
import { successMessage, errorMessage } from "@/utils/Toastify/Messages";

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated?: () => void;
  ownerId?: string;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  onTaskCreated,
  ownerId,
}) => {
  const [currency, setCurrency] = useState(detectUserCurrency());
  const [selectedCategory, setSelectedCategory] = useState<"ALL" | "SOIL" | "PLANTING" | "CARE" | "HARVEST" | "SPECIAL">("ALL");
  const [selectedOperation, setSelectedOperation] = useState<OperationItem>(COMPREHENSIVE_OPERATIONS[0]);

  // Form Fields
  const [taskName, setTaskName] = useState("");
  const [farmName, setFarmName] = useState("Parcela Norte");
  const [clientName, setClientName] = useState("Hacienda Santa Cruz");
  const [totalAcres, setTotalAcres] = useState<number>(20);
  const [pricePerAcre, setPricePerAcre] = useState<number>(65);

  // Fleet & Operator Data
  const [availableTractors, setAvailableTractors] = useState<AvailableTractor[]>([]);
  const [availableOperators, setAvailableOperators] = useState<AvailableOperator[]>([]);
  const [loadingFleet, setLoadingFleet] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Dispatched Assignments
  const [assignments, setAssignments] = useState<TaskAssignment[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    setCurrency(detectUserCurrency());

    let isMounted = true;
    const loadFleet = async () => {
      try {
        setLoadingFleet(true);
        const data = await TaskManagementService.getAvailableFleetAndOperators(ownerId);
        if (isMounted) {
          setAvailableTractors(data.tractors);
          setAvailableOperators(data.operators);

          // Default initial assignment with first available tractor & operator
          if (data.tractors.length > 0) {
            const firstTrac = data.tractors[0];
            const firstOp = data.operators[0] || { id: "op_1", name: "Operador Principal", phone: "" };
            setAssignments([
              {
                tractor_id: firstTrac.id,
                tractor_name: firstTrac.name,
                device_imei: firstTrac.imei,
                operator_id: firstOp.id,
                operator_name: firstOp.name,
                operator_phone: firstOp.phone,
                status: "ACTIVE",
              },
            ]);
          } else {
            // Virtual fallback assignment
            setAssignments([
              {
                tractor_id: "tr_1",
                tractor_name: "Tractor Principal",
                operator_id: "op_1",
                operator_name: data.operators[0]?.name || "Operador de Turno",
                status: "ACTIVE",
              },
            ]);
          }
        }
      } catch (err) {
        console.warn("Error loading fleet for task creation:", err);
      } finally {
        if (isMounted) setLoadingFleet(false);
      }
    };

    loadFleet();
  }, [isOpen, ownerId]);

  // Update default task name when operation changes
  useEffect(() => {
    if (selectedOperation) {
      setTaskName(`${selectedOperation.labelEs} - ${totalAcres} Acres`);
    }
  }, [selectedOperation, totalAcres]);

  if (!isOpen) return null;

  const filteredOps =
    selectedCategory === "ALL"
      ? COMPREHENSIVE_OPERATIONS
      : COMPREHENSIVE_OPERATIONS.filter((o) => o.category === selectedCategory);

  const addMachineAssignment = () => {
    const nextIdx = assignments.length;
    const trac = availableTractors[nextIdx % Math.max(1, availableTractors.length)] || {
      id: `tr_${nextIdx + 1}`,
      name: `Tractor #${nextIdx + 1}`,
      imei: "",
    };
    const op = availableOperators[nextIdx % Math.max(1, availableOperators.length)] || {
      id: `op_${nextIdx + 1}`,
      name: `Chofer ${nextIdx + 1}`,
      phone: "",
    };

    setAssignments([
      ...assignments,
      {
        tractor_id: trac.id,
        tractor_name: trac.name,
        device_imei: trac.imei,
        operator_id: op.id,
        operator_name: op.name,
        operator_phone: op.phone,
        status: "ACTIVE",
      },
    ]);
  };

  const removeAssignment = (index: number) => {
    if (assignments.length <= 1) {
      errorMessage("At least one tractor machine must remain in the dispatch plan.");
      return;
    }
    setAssignments(assignments.filter((_, i) => i !== index));
  };

  const updateAssignment = (index: number, field: keyof TaskAssignment, value: any) => {
    const updated = [...assignments];
    updated[index] = { ...updated[index], [field]: value };
    setAssignments(updated);
  };

  const handleTractorChange = (index: number, tractorId: string) => {
    const trac = availableTractors.find((t) => t.id === tractorId);
    if (trac) {
      const updated = [...assignments];
      updated[index] = {
        ...updated[index],
        tractor_id: trac.id,
        tractor_name: trac.name,
        device_imei: trac.imei,
      };
      setAssignments(updated);
    }
  };

  const handleOperatorChange = (index: number, operatorId: string) => {
    const op = availableOperators.find((o) => o.id === operatorId);
    if (op) {
      const updated = [...assignments];
      updated[index] = {
        ...updated[index],
        operator_id: op.id,
        operator_name: op.name,
        operator_phone: op.phone,
      };
      setAssignments(updated);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskName.trim()) {
      errorMessage("Please enter a task name.");
      return;
    }
    if (totalAcres <= 0) {
      errorMessage("Area must be greater than 0 acres.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await TaskManagementService.createTask({
        task_name: taskName,
        operation_type: selectedOperation.key,
        farm_name: farmName,
        client_name: clientName,
        total_acres: Number(totalAcres),
        price_per_acre: Number(pricePerAcre),
        est_fuel_liters: Math.round(totalAcres * 3.8),
        assignments,
        owner_id: ownerId,
      });

      if (res.success) {
        successMessage("Agricultural task dispatched successfully!");
        if (onTaskCreated) onTaskCreated();
        onClose();
      }
    } catch (err: any) {
      errorMessage("Failed to dispatch task: " + (err.message || "Network error"));
    } finally {
      setSubmitting(false);
    }
  };

  const estFuelLiters = Math.round(totalAcres * 3.8);
  const estGrossRevenue = Math.round(totalAcres * pricePerAcre);
  const estHours = Math.round((totalAcres / 1.6) * 10) / 10;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden my-auto">
        {/* Header with Stitch Maroon Accent */}
        <div className="flex items-center justify-between px-6 py-5 bg-gradient-to-r from-red-800 via-red-900 to-amber-950 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center shadow-inner">
              <Tractor className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-white tracking-tight">
                  Dispatch New Agricultural Task
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-400/20 border border-amber-300/30 text-[10px] font-black uppercase text-amber-200">
                  TractorAI
                </span>
              </div>
              <p className="text-xs text-red-100/80 mt-0.5">
                Assign multi-machine fleets, set acreage targets, and monitor real-time telematics
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Step 1: Operation Selection Catalog */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-red-100 text-red-800 font-black text-xs flex items-center justify-center">1</span>
                Select Agricultural Operation
              </label>
              <span className="text-xs text-slate-400 font-medium">
                {selectedOperation.labelEs} ({selectedOperation.labelEn})
              </span>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3">
              {(
                [
                  { id: "ALL", label: "All Operations" },
                  { id: "SOIL", label: "Soil & Tillage" },
                  { id: "PLANTING", label: "Planting & Seeding" },
                  { id: "CARE", label: "Crop Care & Spray" },
                  { id: "HARVEST", label: "Harvesting & Hay" },
                  { id: "SPECIAL", label: "Special & Haulage" },
                ] as const
              ).map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 transition-all ${
                    selectedCategory === cat.id
                      ? "bg-red-800 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Operation Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-48 overflow-y-auto p-1 border border-slate-100 rounded-2xl bg-slate-50/50">
              {filteredOps.map((op) => {
                const isSelected = selectedOperation.key === op.key;
                return (
                  <button
                    key={op.key}
                    type="button"
                    onClick={() => setSelectedOperation(op)}
                    className={`p-3 rounded-xl text-left border transition-all flex flex-col justify-between ${
                      isSelected
                        ? "bg-white border-red-700 shadow-md ring-2 ring-red-700/20"
                        : "bg-white border-slate-200/80 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-black text-slate-800 leading-tight">
                        {op.labelEs}
                      </span>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-red-700 shrink-0 ml-1" />}
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 line-clamp-2">
                      {op.descEs}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Field Specifications */}
          <div>
            <label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5 mb-3">
              <span className="w-5 h-5 rounded-full bg-red-100 text-red-800 font-black text-xs flex items-center justify-center">2</span>
              Field & Commercial Specifications
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">
                  Task Title
                </label>
                <input
                  type="text"
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  placeholder="e.g. Arado Profundo Parcela Norte"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-600"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">
                  Farm / Field Name
                </label>
                <input
                  type="text"
                  value={farmName}
                  onChange={(e) => setFarmName(e.target.value)}
                  placeholder="e.g. Parcela Central"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-600"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">
                  Total Area to Work (Acres)
                </label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={totalAcres}
                  onChange={(e) => setTotalAcres(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-600"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">
                  Rate Per Acre ({currency.symbol} {currency.code})
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    {currency.symbol}
                  </span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={pricePerAcre}
                    onChange={(e) => setPricePerAcre(parseFloat(e.target.value) || 0)}
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-600"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Step 3: Multi-Tractor & Operator Dispatch */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-red-100 text-red-800 font-black text-xs flex items-center justify-center">3</span>
                Dispatch Machines & Assigned Operators ({assignments.length} Selected)
              </label>
              <button
                type="button"
                onClick={addMachineAssignment}
                className="flex items-center gap-1.5 text-xs font-bold text-red-800 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-full transition-all"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>Add Machine to Dispatch</span>
              </button>
            </div>

            <div className="space-y-3">
              {assignments.map((asgn, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="w-8 h-8 rounded-xl bg-red-800 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm">
                      #{idx + 1}
                    </div>

                    {/* Tractor Selector */}
                    <div className="flex-1 md:w-56">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                        Tractor Unit
                      </label>
                      {availableTractors.length > 0 ? (
                        <select
                          value={asgn.tractor_id}
                          onChange={(e) => handleTractorChange(idx, e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-red-600"
                        >
                          {availableTractors.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={asgn.tractor_name}
                          onChange={(e) => updateAssignment(idx, "tractor_name", e.target.value)}
                          placeholder="Nombre del Tractor"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-800 bg-white"
                        />
                      )}
                    </div>
                  </div>

                  {/* Operator Selector */}
                  <div className="flex-1 w-full md:w-56">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                      Assigned Driver
                    </label>
                    {availableOperators.length > 0 ? (
                      <select
                        value={asgn.operator_id}
                        onChange={(e) => handleOperatorChange(idx, e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-red-600"
                      >
                        {availableOperators.map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.name} {o.phone ? `(${o.phone})` : ""}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={asgn.operator_name}
                        onChange={(e) => updateAssignment(idx, "operator_name", e.target.value)}
                        placeholder="Nombre del Chofer"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-800 bg-white"
                      />
                    )}
                  </div>

                  {/* Delete Machine Button */}
                  <button
                    type="button"
                    onClick={() => removeAssignment(idx)}
                    className="self-end md:self-center p-2 rounded-xl text-slate-400 hover:text-red-700 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Step 4: AI Telemetry & Financial Forecast Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-white flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-black uppercase text-amber-300">
                  Pre-Dispatch Telemetry Forecast
                </span>
                <p className="text-xs text-slate-300">
                  Calculated based on {assignments.length} machines for {totalAcres} acres of {selectedOperation.labelEs}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Est. Diesel</span>
                <span className="font-black text-amber-300">{estFuelLiters} Liters</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Work Time</span>
                <span className="font-black text-white">~{estHours} Hours</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Projected Revenue</span>
                <span className="font-black text-emerald-400">
                  {currency.symbol}{estGrossRevenue.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold transition-all"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-red-800 hover:bg-red-900 text-white font-black text-xs uppercase tracking-wider shadow-lg hover:shadow-xl transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Tractor className="w-4 h-4" />
              <span>{submitting ? "Dispatching Fleet..." : "Confirm & Dispatch Fleet"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTaskModal;
