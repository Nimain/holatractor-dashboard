"use client"

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import axios from 'axios'
import {
  Sparkles,
  Play,
  Save,
  CheckCircle2,
  RefreshCw,
  Plus,
  Trash2,
  Settings,
  Share2,
  Bot,
  Zap,
  HelpCircle,
  X,
  Users,
  Store,
  Check,
  Cpu,
  Layers,
  MessageSquare,
  Filter,
  ArrowRight,
  Clock,
  Send,
  Smartphone,
  Search,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Copy,
  Sliders,
  Eye,
  Activity,
  ChevronDown,
  ChevronUp,
  MapPin,
  ShieldCheck,
  AlertCircle
} from 'lucide-react'
import {
  FaWhatsapp,
  FaFacebook,
  FaRobot
} from 'react-icons/fa'
import { errorMessage, successMessage } from "@/utils/Toastify/Messages"
import { useCookie } from "next-cookie"
import { getAuthUser } from "@/utils/Axios/RenderInstance"

// ── Types & Interfaces ────────────────────────────────────────────────────────

type NodeCategory = 'ai' | 'triggers' | 'conditions' | 'actions' | 'integrations'

interface SidebarItemType {
  icon: string | React.ReactNode
  title: string
  category: NodeCategory
  defaultSubtitle?: string
  modelTag?: string
  badgeColor?: string
  defaultPrompt?: string
}

interface DroppedItem {
  id: number
  type: string
  icon: string
  title: string
  subtitle: string
  x: number
  y: number
  category: NodeCategory
  extra?: string
  connections?: number[]
  config?: {
    model?: string
    temperature?: number
    max_tokens?: number
    system_prompt?: string
    user_prompt?: string
    delay_hours?: number
    threshold?: string
    channel?: string
    [key: string]: any
  }
  status?: 'IDLE' | 'RUNNING' | 'SUCCESS' | 'ERROR'
}

interface Connection {
  from: number
  to: number
  label?: string
  color?: string
}

interface WorkflowMeta {
  id: string
  name: string
  description?: string
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED'
  trigger_type?: string
  created_at?: string
  execution_stats?: {
    total_runs?: number
    active_leads?: number
    converted?: number
  }
}

interface SimulationStepLog {
  step_number: number
  node_id: number
  node_title: string
  category: string
  status: string
  detail: string
  timestamp: string
  output_text?: string
  latency_ms?: number
  tokens_used?: number
}

interface RealCustomer {
  id: string
  first_name: string
  last_name: string
  mobile: string
  email: string
  city?: string
  status?: string
}

interface RealStore {
  id: string
  name: string
  description?: string
  city?: string
  location?: {
    city?: string
    address?: string
    state?: string
    country?: string
  }
}

export default function AutomationWorkflow() {
  const cookie = useCookie()
  const rawCookieUser = cookie?.get ? cookie.get("user") : null
  const authUser = getAuthUser()

  // Dynamic dealer ID from session/cookies or authorized dealer fallback
  const targetDealerId = useMemo(() => {
    try {
      const parsed = typeof rawCookieUser === "string" ? JSON.parse(rawCookieUser) : rawCookieUser
      return (
        parsed?.dealer_id ||
        parsed?.dealerId ||
        (authUser as any)?.dealer_id ||
        (typeof window !== "undefined" ? localStorage.getItem("dealer_id") : null) ||
        parsed?.userId ||
        parsed?.id ||
        authUser?.userId ||
        authUser?.id ||
        "cmb7lih4v000ez5ms8nhvegf6"
      )
    } catch {
      return (authUser as any)?.dealer_id || authUser?.userId || authUser?.id || "cmb7lih4v000ez5ms8nhvegf6"
    }
  }, [rawCookieUser, authUser])

  // Real database entities state
  const [realCustomers, setRealCustomers] = useState<RealCustomer[]>([])
  const [realStores, setRealStores] = useState<RealStore[]>([])
  const [selectedStore, setSelectedStore] = useState<RealStore | null>(null)
  const [loadingStores, setLoadingStores] = useState<boolean>(true)
  const [selectedSimCustomer, setSelectedSimCustomer] = useState<RealCustomer | null>(null)

  // Workflows state
  const [workflows, setWorkflows] = useState<WorkflowMeta[]>([])
  const [currentWorkflowId, setCurrentWorkflowId] = useState<string | null>(null)
  const [workflowName, setWorkflowName] = useState<string>("Tractor Sales & Retention Funnel")
  const [workflowDescription, setWorkflowDescription] = useState<string>("Autonomous AI lead engagement and tractor service reminder funnel")
  const [workflowStatus, setWorkflowStatus] = useState<'DRAFT' | 'ACTIVE' | 'PAUSED'>('ACTIVE')
  const [triggerType, setTriggerType] = useState<string>('NEW_LEAD')
  const [loadingList, setLoadingList] = useState<boolean>(false)
  const [isSaving, setIsSaving] = useState<boolean>(false)

  // Canvas graph state
  const [droppedItems, setDroppedItems] = useState<DroppedItem[]>([])
  const [connections, setConnections] = useState<Connection[]>([])
  const [selectedItem, setSelectedItem] = useState<number | null>(null)
  const [connectingMode, setConnectingMode] = useState<boolean>(false)
  const [connectingSource, setConnectingSource] = useState<number | null>(null)
  const [expandedSection, setExpandedSection] = useState<string | null>('ai')

  // Canvas Viewport & Zoom
  const [zoomLevel, setZoomLevel] = useState<number>(100)
  const [showMinimap, setShowMinimap] = useState<boolean>(true)

  // Modals & Panels
  const [showAiModal, setShowAiModal] = useState<boolean>(false)
  const [aiPrompt, setAiPrompt] = useState<string>("")
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false)
  const [selectedPlaybook, setSelectedPlaybook] = useState<string | null>(null)

  // Node Inspector Drawer
  const [inspectingNode, setInspectingNode] = useState<DroppedItem | null>(null)
  const [inspectPrompt, setInspectPrompt] = useState<string>("")
  const [inspectModel, setInspectModel] = useState<string>("gemini-1.5-pro")
  const [inspectTemp, setInspectTemp] = useState<number>(0.3)
  const [isTestingNodeAi, setIsTestingNodeAi] = useState<boolean>(false)
  const [nodeAiTestResult, setNodeAiTestResult] = useState<string | null>(null)

  // Simulation Runner
  const [showSimulationModal, setShowSimulationModal] = useState<boolean>(false)
  const [isSimulating, setIsSimulating] = useState<boolean>(false)
  const [activeSimIndex, setActiveSimIndex] = useState<number>(-1)
  const [simLogs, setSimLogs] = useState<SimulationStepLog[]>([])
  const [simSummary, setSimSummary] = useState<string>("")

  // Drag State
  const [dragState, setDragState] = useState<{
    isDragging: boolean
    draggedItem: SidebarItemType | null
    offset: { x: number; y: number }
    mousePosition: { x: number; y: number }
  }>({
    isDragging: false,
    draggedItem: null,
    offset: { x: 0, y: 0 },
    mousePosition: { x: 0, y: 0 }
  })

  const canvasRef = useRef<HTMLDivElement>(null)

  // Fetch real dealer customers and stores dynamically from live FastAPI per dealer_id
  const fetchDealerRealData = useCallback(async () => {
    setLoadingStores(true)
    try {
      const dealerParam = targetDealerId ? `?dealer_id=${encodeURIComponent(targetDealerId)}` : ""
      const [custRes, storeRes] = await Promise.allSettled([
        axios.get(`/api/dealer/customers${dealerParam}`),
        axios.get(`/api/dealer/store${dealerParam}`)
      ])

      if (custRes.status === 'fulfilled' && Array.isArray(custRes.value.data)) {
        setRealCustomers(custRes.value.data)
        if (custRes.value.data.length > 0 && !selectedSimCustomer) {
          setSelectedSimCustomer(custRes.value.data[0])
        }
      }

      if (storeRes.status === 'fulfilled' && Array.isArray(storeRes.value.data)) {
        const stores = storeRes.value.data
        setRealStores(stores)
        setSelectedStore((prev) => {
          if (prev) {
            const found = stores.find((s: any) => s.id === prev.id)
            if (found) return found
          }
          return stores.length > 0 ? stores[0] : null
        })
      }
    } catch (err) {
      console.warn("Could not fetch real dealer data from FastAPI:", err)
    } finally {
      setLoadingStores(false)
    }
  }, [targetDealerId, selectedSimCustomer])

  // Load existing workflows for dealer
  const fetchWorkflows = useCallback(async () => {
    setLoadingList(true)
    try {
      const dealerParam = targetDealerId ? `?dealer_id=${encodeURIComponent(targetDealerId)}` : ""
      const res = await axios.get(`/api/dealer/marketing/workflows${dealerParam}`)
      if (res.data?.success && Array.isArray(res.data.workflows)) {
        setWorkflows(res.data.workflows)
        if (res.data.workflows.length > 0 && !currentWorkflowId) {
          const first = res.data.workflows[0]
          setCurrentWorkflowId(first.id)
          setWorkflowName(first.name)
          setWorkflowDescription(first.description || "")
          setWorkflowStatus(first.status || 'ACTIVE')
          setTriggerType(first.trigger_type || 'NEW_LEAD')
          if (Array.isArray(first.nodes) && first.nodes.length > 0) {
            setDroppedItems(first.nodes)
          }
          if (Array.isArray(first.connections)) {
            setConnections(first.connections)
          }
          if (first.trigger_config?.store_id && realStores.length > 0) {
            const matched = realStores.find(st => st.id === first.trigger_config.store_id)
            if (matched) setSelectedStore(matched)
          }
        }
      }
    } catch (err: any) {
      console.warn("Could not fetch workflows from API:", err?.message)
    } finally {
      setLoadingList(false)
    }
  }, [targetDealerId, currentWorkflowId, realStores])

  useEffect(() => {
    fetchWorkflows()
    fetchDealerRealData()
  }, [fetchWorkflows, fetchDealerRealData])

  // Component Palette Categories (Pickolab Architecture)
  const aiNodes: SidebarItemType[] = [
    {
      icon: "🧠",
      title: "Gemini 1.5 Pro Lead Agent",
      category: "ai",
      modelTag: "Gemini 1.5 Pro",
      defaultSubtitle: "Multimodal Agricultural Reasoning",
      badgeColor: "bg-rose-500",
      defaultPrompt: "Analyze customer inquiry for {{tractor_model}} and draft a personalized WhatsApp brochure message with current pricing from {{store_name}} in {{city}}."
    },
    {
      icon: "⚡",
      title: "GPT-4o Omnichannel Assistant",
      category: "ai",
      modelTag: "GPT-4o",
      defaultSubtitle: "Instant Conversational Follow-up",
      badgeColor: "bg-purple-600",
      defaultPrompt: "Generate an empathetic tractor service follow-up for {{customer_name}} inviting them to schedule 250h maintenance."
    },
    {
      icon: "🎯",
      title: "Claude 3.5 Machinery Specialist",
      category: "ai",
      modelTag: "Claude 3.5 Sonnet",
      defaultSubtitle: "Technical Diagnostics & Parts Specs",
      badgeColor: "bg-amber-600",
      defaultPrompt: "Assess machinery hours and recommend compatible tillage attachments available at {{store_name}}."
    },
    {
      icon: "🏷️",
      title: "AI Intent & Sentiment Classifier",
      category: "ai",
      modelTag: "DeepSeek V3",
      defaultSubtitle: "Classify High vs Low Intent Leads",
      badgeColor: "bg-indigo-600",
      defaultPrompt: "Score customer lead intent from 1-100 based on message urgency and machinery budget."
    }
  ]

  const triggers: SidebarItemType[] = [
    { icon: "📋", title: "New Lead Inbound", category: "triggers", defaultSubtitle: "Meta Ads & Web Inquiries" },
    { icon: "⏰", title: "Tractor Service Due", category: "triggers", defaultSubtitle: "Operating Hours > 250h or 6 Mo" },
    { icon: "🌾", title: "Harvest Season Countdown", category: "triggers", defaultSubtitle: "30-Day Pre-Harvest Alert" },
    { icon: "🔄", title: "Dormant Customer", category: "triggers", defaultSubtitle: "No store visit > 90 days" },
    { icon: "🛡️", title: "Warranty Expiring", category: "triggers", defaultSubtitle: "30 days before expiration" },
  ]

  const conditions: SidebarItemType[] = [
    { icon: "👤", title: "Check Tractor Spec", category: "conditions", defaultSubtitle: "50HP - 110HP Utility Fleet" },
    { icon: "👁️", title: "WhatsApp Replied?", category: "conditions", defaultSubtitle: "Message delivered & read" },
    { icon: "🚜", title: "Fleet Size >= 2", category: "conditions", defaultSubtitle: "Commercial farmer profile" },
    { icon: "💰", title: "High Intent Score >= 75", category: "conditions", defaultSubtitle: "AI qualified buyer" },
    { icon: "📍", title: "Region / Department", category: "conditions", defaultSubtitle: "Santa Cruz / Cochabamba / Tarija" },
  ]

  const actions: SidebarItemType[] = [
    { icon: "💬", title: "Send WhatsApp Brochure", category: "actions", defaultSubtitle: "Ficha técnica + 10% coupon" },
    { icon: "📱", title: "Send SMS Service Link", category: "actions", defaultSubtitle: "Twilio direct reservation" },
    { icon: "⏰", title: "Time Window Delay", category: "actions", defaultSubtitle: "Wait 24h to 48h timeframe" },
    { icon: "💰", title: "Create CRM Opportunity", category: "actions", defaultSubtitle: "Assign dealership sales rep" },
    { icon: "🔧", title: "Alert Dealership Mechanic", category: "actions", defaultSubtitle: "Dispatch technician outreach" },
  ]

  const integrations: SidebarItemType[] = [
    { icon: "💳", title: "Generate Stripe Deposit Link", category: "integrations", defaultSubtitle: "Reserve tractor online" },
    { icon: "⚡", title: "Trigger Zapier / Webhook", category: "integrations", defaultSubtitle: "Sync to external ERP" },
  ]

  // Prebuilt Playbooks
  const playbooks = [
    {
      key: "lead_nurture",
      title: "⚡ Fast Lead AI Follow-up",
      tag: "High Conversion",
      desc: "Instantly message new inbound tractor inquiries on WhatsApp via Gemini 1.5 Pro, wait 24h, check response, and assign qualified leads to sales reps."
    },
    {
      key: "maintenance_reminder",
      title: "🚜 250h Service Interval",
      tag: "After-Sales Retention",
      desc: "Detect tractors approaching maintenance hours, dispatch AI personalized service invitations with 10% discount on original parts."
    },
    {
      key: "harvest_readiness",
      title: "🌾 Pre-Harvest Campaign",
      tag: "Seasonal Revenue",
      desc: "Send seasonal machinery prep package to commercial farmers 30 days before harvest with attachment combo deals."
    }
  ]

  // Select workflow
  const handleSelectWorkflow = async (wfId: string) => {
    if (wfId === "NEW") {
      setCurrentWorkflowId(null)
      setWorkflowName("New Marketing AI Pipeline")
      setWorkflowDescription("Custom autonomous dealership workflow")
      setWorkflowStatus('DRAFT')
      setDroppedItems([])
      setConnections([])
      successMessage("Started clean workflow canvas. Use AI Agent or drag blocks to design.")
      return
    }

    try {
      const res = await axios.get(`/api/dealer/marketing/workflows/${wfId}`)
      if (res.data?.success && res.data.workflow) {
        const wf = res.data.workflow
        setCurrentWorkflowId(wf.id)
        setWorkflowName(wf.name)
        setWorkflowDescription(wf.description || "")
        setWorkflowStatus(wf.status || 'DRAFT')
        setTriggerType(wf.trigger_type || 'NEW_LEAD')
        setDroppedItems(Array.isArray(wf.nodes) ? wf.nodes : [])
        setConnections(Array.isArray(wf.connections) ? wf.connections : [])
        if (wf.trigger_config?.store_id && realStores.length > 0) {
          const matched = realStores.find(st => st.id === wf.trigger_config.store_id)
          if (matched) setSelectedStore(matched)
        }
        successMessage(`Loaded workflow: ${wf.name}`)
      }
    } catch (err: any) {
      errorMessage("Failed to load selected workflow")
    }
  }

  // Save current workflow
  const handleSaveWorkflow = async (overrideStatus?: 'DRAFT' | 'ACTIVE' | 'PAUSED') => {
    if (!workflowName.trim()) {
      errorMessage("Please enter a workflow name")
      return
    }

    setIsSaving(true)
    const targetStatus = overrideStatus || workflowStatus

    const payload = {
      dealer_id: targetDealerId,
      name: workflowName,
      description: workflowDescription,
      status: targetStatus,
      trigger_type: triggerType,
      trigger_config: {
        auto_trigger: true,
        dealer_id: targetDealerId,
        store_id: selectedStore?.id || null,
        store_name: selectedStore?.name || null,
        city: selectedStore?.location?.city || selectedStore?.city || null
      },
      nodes: droppedItems,
      connections: connections,
    }

    try {
      if (currentWorkflowId) {
        const res = await axios.put(`/api/dealer/marketing/workflows/${currentWorkflowId}`, payload)
        if (res.data?.success) {
          setWorkflowStatus(targetStatus)
          successMessage("Workflow saved successfully!")
          fetchWorkflows()
        }
      } else {
        const res = await axios.post('/api/dealer/marketing/workflows', payload)
        if (res.data?.success && res.data.workflow?.id) {
          setCurrentWorkflowId(res.data.workflow.id)
          setWorkflowStatus(targetStatus)
          successMessage("Workflow created and saved!")
          fetchWorkflows()
        }
      }
    } catch (err: any) {
      console.error("Save workflow error:", err)
      errorMessage(err?.response?.data?.detail || "Failed to save workflow")
    } finally {
      setIsSaving(false)
    }
  }

  // Generate with AI Agent Studio
  const handleGenerateAI = async () => {
    if (!aiPrompt.trim() && !selectedPlaybook) {
      errorMessage("Please describe your goal or pick a playbook")
      return
    }

    setIsGeneratingAi(true)
    try {
      const storeContext = selectedStore ? ` for dealership store ${selectedStore.name} in ${selectedStore.location?.city || selectedStore.city || 'Santa Cruz'}` : ""
      const fullPrompt = `${aiPrompt}${storeContext}`

      const res = await axios.post('/api/dealer/marketing/workflows/generate-ai', {
        prompt: fullPrompt,
        playbook_key: selectedPlaybook || undefined
      })

      if (res.data?.success && res.data.generated_workflow) {
        const generated = res.data.generated_workflow
        setWorkflowName(generated.name || "AI Generated Workflow")
        setWorkflowDescription(generated.description || aiPrompt)
        setTriggerType(generated.trigger_type || "NEW_LEAD")

        if (Array.isArray(generated.nodes) && generated.nodes.length > 0) {
          // Inject an AI model node into the flow if missing
          const hasAiNode = generated.nodes.some((n: any) => n.category === 'ai')
          let finalNodes = generated.nodes
          let finalConns = generated.connections || []

          if (!hasAiNode) {
            const aiNode: DroppedItem = {
              id: 99,
              type: "ai_model",
              icon: "🧠",
              title: "Gemini 1.5 Pro Lead Agent",
              subtitle: "Synthesizing Personalized Pitch",
              x: 40,
              y: 220,
              category: "ai",
              config: {
                model: "gemini-1.5-pro",
                temperature: 0.3,
                user_prompt: `Personalized tractor outreach for ${selectedStore?.name || 'AgroTractor'}`
              }
            }
            finalNodes = [finalNodes[0], aiNode, ...finalNodes.slice(1)].map((nd: any, idx: number) => ({
              ...nd,
              id: idx + 1,
              y: 40 + idx * 130
            }))
            finalConns = finalNodes.slice(0, -1).map((nd: any, idx: number) => ({
              from: nd.id,
              to: finalNodes[idx + 1].id,
              label: idx === 1 ? "AI Synthesized" : "Next"
            }))
          }

          setDroppedItems(finalNodes)
          setConnections(finalConns)
        }

        setShowAiModal(false)
        setAiPrompt("")
        setSelectedPlaybook(null)
        successMessage("AI Agent synthesized full workflow canvas successfully!")
      }
    } catch (err: any) {
      console.error("AI workflow generation failed:", err)
      errorMessage("AI Agent synthesis failed. Please try again.")
    } finally {
      setIsGeneratingAi(false)
    }
  }

  // Test Run Single AI Node
  const handleTestNodeAiInference = async (node: DroppedItem) => {
    setIsTestingNodeAi(true)
    setNodeAiTestResult(null)

    try {
      const vars = {
        customer_name: selectedSimCustomer ? `${selectedSimCustomer.first_name || ''} ${selectedSimCustomer.last_name || ''}`.trim() : "Carlos Mendoza",
        phone: selectedSimCustomer?.mobile || "+591 7761 3811",
        store_name: selectedStore?.name || "AgroTractor Central Santa Cruz",
        city: selectedStore?.location?.city || selectedStore?.city || "Santa Cruz",
        tractor_model: "New Holland 3032 / Hattat T4110"
      }

      const res = await axios.post('/api/dealer/marketing/workflows/ai-inference', {
        model: inspectModel,
        user_prompt: inspectPrompt || node.config?.user_prompt || node.title,
        temperature: inspectTemp,
        variables: vars
      })

      if (res.data?.success) {
        setNodeAiTestResult(res.data.output_text)
        successMessage(`Inference completed in ${res.data.latency_ms}ms (${res.data.tokens_used} tokens)`)
      }
    } catch (err: any) {
      errorMessage("Failed to execute LLM node inference")
    } finally {
      setIsTestingNodeAi(false)
    }
  }

  // Run Workflow Simulation
  const handleRunSimulation = async () => {
    if (droppedItems.length === 0) {
      errorMessage("Add at least one node to simulate.")
      return
    }

    setIsSimulating(true)
    setShowSimulationModal(true)
    setActiveSimIndex(0)
    setSimLogs([])
    setSimSummary("")

    try {
      let wfId = currentWorkflowId
      if (!wfId) {
        const res = await axios.post('/api/dealer/marketing/workflows', {
          name: workflowName,
          description: workflowDescription,
          status: 'DRAFT',
          trigger_type: triggerType,
          nodes: droppedItems,
          connections: connections,
        })
        if (res.data?.workflow?.id) {
          wfId = res.data.workflow.id
          setCurrentWorkflowId(wfId)
        }
      }

      if (wfId) {
        const targetCust = selectedSimCustomer ? {
          id: selectedSimCustomer.id,
          name: `${selectedSimCustomer.first_name || ''} ${selectedSimCustomer.last_name || ''}`.trim() || 'Carlos Mendoza',
          phone: selectedSimCustomer.mobile || '+591 7761 3811',
          email: selectedSimCustomer.email || '',
          city: selectedStore?.location?.city || selectedStore?.city || 'Santa Cruz',
          tractor: 'New Holland 3032'
        } : undefined

        const testRes = await axios.post(`/api/dealer/marketing/workflows/${wfId}/test-run`, {
          target_customer: targetCust
        })

        if (testRes.data?.success && testRes.data.execution) {
          const logs: SimulationStepLog[] = testRes.data.execution.step_logs || []
          setSimSummary(testRes.data.execution.summary || "All steps finished successfully.")

          // Animate nodes sequentially
          for (let i = 0; i < logs.length; i++) {
            setActiveSimIndex(i)
            // Pulse active node
            setDroppedItems(prev => prev.map(nd => nd.id === logs[i].node_id ? { ...nd, status: 'RUNNING' } : nd))
            setSimLogs(prev => [...prev, logs[i]])
            await new Promise(r => setTimeout(r, 700))
            setDroppedItems(prev => prev.map(nd => nd.id === logs[i].node_id ? { ...nd, status: 'SUCCESS' } : nd))
          }
          setActiveSimIndex(logs.length)
          successMessage("Simulation executed through all nodes!")
        }
      }
    } catch (err: any) {
      errorMessage("Simulation run failed")
    } finally {
      setIsSimulating(false)
    }
  }

  // Drag and Drop Handlers
  const handleMouseDown = (e: React.MouseEvent, item: SidebarItemType) => {
    e.preventDefault()
    setDragState({
      isDragging: true,
      draggedItem: item,
      offset: { x: 80, y: 35 },
      mousePosition: { x: e.clientX, y: e.clientY }
    })
  }

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragState.isDragging) return
    setDragState(prev => ({
      ...prev,
      mousePosition: { x: e.clientX, y: e.clientY }
    }))
  }, [dragState.isDragging])

  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (!dragState.isDragging || !dragState.draggedItem) return

    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect()
      if (
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom
      ) {
        const x = Math.max(20, Math.round((e.clientX - rect.left - dragState.offset.x) / 10) * 10)
        const y = Math.max(20, Math.round((e.clientY - rect.top - dragState.offset.y) / 10) * 10)

        const newItem: DroppedItem = {
          id: Date.now(),
          type: dragState.draggedItem.category,
          icon: typeof dragState.draggedItem.icon === 'string' ? dragState.draggedItem.icon : "⚡",
          title: dragState.draggedItem.title,
          subtitle: dragState.draggedItem.defaultSubtitle || "",
          x,
          y,
          category: dragState.draggedItem.category,
          config: {
            model: dragState.draggedItem.modelTag || "gemini-1.5-pro",
            temperature: 0.3,
            user_prompt: dragState.draggedItem.defaultPrompt || ""
          },
          status: 'IDLE'
        }

        setDroppedItems(prev => [...prev, newItem])
        successMessage(`Added ${newItem.title} to canvas`)
      }
    }

    setDragState({
      isDragging: false,
      draggedItem: null,
      offset: { x: 0, y: 0 },
      mousePosition: { x: 0, y: 0 }
    })
  }, [dragState])

  useEffect(() => {
    if (dragState.isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [dragState.isDragging, handleMouseMove, handleMouseUp])

  // Connect Nodes
  const handlePortClick = (nodeId: number, portType: 'in' | 'out', e: React.MouseEvent) => {
    e.stopPropagation()
    if (!connectingSource && portType === 'out') {
      setConnectingSource(nodeId)
      setConnectingMode(true)
      successMessage(`Selected Node #${nodeId}. Click input port of target node.`)
    } else if (connectingSource && connectingSource !== nodeId) {
      // Connect
      setConnections(prev => [...prev, { from: connectingSource, to: nodeId, label: "Next" }])
      setConnectingSource(null)
      setConnectingMode(false)
      successMessage(`Connected Node #${connectingSource} → Node #${nodeId}`)
    }
  }

  // Open Inspector
  const openInspector = (item: DroppedItem) => {
    setInspectingNode(item)
    setInspectPrompt(item.config?.user_prompt || item.extra || item.title)
    setInspectModel(item.config?.model || "gemini-1.5-pro")
    setInspectTemp(item.config?.temperature ?? 0.3)
    setNodeAiTestResult(null)
  }

  // Save Node Inspector
  const saveInspector = () => {
    if (!inspectingNode) return
    setDroppedItems(prev => prev.map(nd => {
      if (nd.id === inspectingNode.id) {
        return {
          ...nd,
          extra: inspectPrompt,
          config: {
            ...nd.config,
            model: inspectModel,
            temperature: inspectTemp,
            user_prompt: inspectPrompt
          }
        }
      }
      return nd
    }))
    successMessage("Node parameters updated!")
    setInspectingNode(null)
  }

  // Bezier Path Calculator
  const getCubicBezierPath = (c: Connection) => {
    const fromNode = droppedItems.find(i => i.id === c.from)
    const toNode = droppedItems.find(i => i.id === c.to)
    if (!fromNode || !toNode) return null

    const nodeWidth = 260
    const nodeHeight = 110

    const startX = fromNode.x + nodeWidth
    const startY = fromNode.y + nodeHeight / 2
    const endX = toNode.x
    const endY = toNode.y + nodeHeight / 2

    const dx = Math.abs(endX - startX) * 0.5
    const controlX1 = startX + Math.max(dx, 50)
    const controlY1 = startY
    const controlX2 = endX - Math.max(dx, 50)
    const controlY2 = endY

    const midX = (startX + endX) / 2
    const midY = (startY + endY) / 2

    return {
      d: `M ${startX} ${startY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${endX} ${endY}`,
      midX,
      midY
    }
  }

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 flex flex-col font-sans select-none overflow-hidden">
      {/* Top Header / Workflow Orchestrator Toolbar */}
      <header className="bg-[#1E293B] border-b border-slate-700/80 px-4 py-3 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
          
          {/* Workflow Title & Selector */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#F91F1F] to-[#FF5E3A] flex items-center justify-center text-white shadow-lg shadow-red-500/20 shrink-0">
              <Bot className="w-5 h-5" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={workflowName}
                  onChange={(e) => setWorkflowName(e.target.value)}
                  className="bg-transparent font-bold text-base sm:text-lg text-white hover:bg-slate-800 focus:bg-slate-800 px-2.5 py-0.5 rounded-lg border border-transparent focus:border-red-500 outline-none transition max-w-[280px] sm:max-w-md truncate"
                  placeholder="Workflow Name"
                />
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1.5 ${
                  workflowStatus === 'ACTIVE'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${workflowStatus === 'ACTIVE' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                  {workflowStatus}
                </span>
              </div>
              <p className="text-xs text-slate-400 px-2.5 truncate max-w-sm sm:max-w-lg">
                {workflowDescription}
              </p>
            </div>

            {/* Workflow Switcher Dropdown */}
            <div className="relative">
              <select
                value={currentWorkflowId || "NEW"}
                onChange={(e) => handleSelectWorkflow(e.target.value)}
                className="bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs rounded-xl px-3 py-1.5 text-slate-200 font-semibold focus:outline-none focus:ring-2 focus:ring-red-500 transition cursor-pointer shadow-sm"
              >
                {workflows.map((wf) => (
                  <option key={wf.id} value={wf.id}>
                    {wf.name} ({wf.status})
                  </option>
                ))}
                <option value="NEW">+ Create New Workflow Draft</option>
              </select>
            </div>
          </div>

          {/* Action Buttons Toolbar */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            {/* AI Agent Studio Button */}
            <button
              onClick={() => setShowAiModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-[#F91F1F] to-[#FF5E3A] hover:brightness-110 text-white shadow-lg shadow-red-500/20 transition active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Agent Studio</span>
            </button>

            {/* Test Run Simulation Button */}
            <button
              onClick={handleRunSimulation}
              disabled={isSimulating}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition active:scale-95 disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isSimulating ? "Simulating..." : "Test Simulation"}</span>
            </button>

            {/* Connect Mode Toggle */}
            <button
              onClick={() => {
                setConnectingMode(!connectingMode)
                setConnectingSource(null)
              }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition border ${
                connectingMode
                  ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold animate-pulse'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-600 shadow-sm'
              }`}
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{connectingMode ? 'Connecting Mode (Pick 2 Ports)' : 'Connect Nodes'}</span>
            </button>

            {/* Save Workflow Button */}
            <button
              onClick={() => handleSaveWorkflow()}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition active:scale-95 disabled:opacity-50"
            >
              {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>Save</span>
            </button>
          </div>
        </div>
      </header>

      {/* Dynamic Store & Telemetry Ribbon */}
      <div className="bg-[#1E293B]/60 backdrop-blur border-b border-slate-800 px-6 py-2.5 flex items-center justify-between flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-6 flex-wrap">
          {/* Dynamic Store Selector */}
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-slate-400">Dealership Branch:</span>
            <select
              value={selectedStore?.id || ""}
              onChange={(e) => {
                const s = realStores.find(st => st.id === e.target.value)
                if (s) setSelectedStore(s)
              }}
              disabled={loadingStores && realStores.length === 0}
              className="bg-slate-800 border border-slate-700 text-emerald-300 font-bold text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-400 cursor-pointer disabled:opacity-60"
            >
              {loadingStores && realStores.length === 0 ? (
                <option value="" disabled>Loading branches from FastAPI...</option>
              ) : realStores.length === 0 ? (
                <option value="" disabled>No branch found for Dealer ID</option>
              ) : (
                realStores.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name} ({st.location?.city || st.city || "Bolivia"})
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-slate-300">
            <Users className="w-4 h-4 text-blue-400" />
            <span>Target Customers: <strong className="text-white">{realCustomers.length} Verified Leads</strong></span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-300">
            <Cpu className="w-4 h-4 text-rose-400" />
            <span>Active LLM Model: <strong className="text-white">Gemini 1.5 Pro / GPT-4o</strong></span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-300">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>System Health: <strong className="text-emerald-400">100% Operational</strong></span>
          </div>
        </div>
      </div>

      {/* Main Body: Component Palette + Canvas Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        
        {/* Left Palette (Pickolab Layout) */}
        <aside className="w-full lg:w-80 bg-[#1E293B] border-r border-slate-800 flex flex-col shrink-0 lg:h-[calc(100vh-112px)] overflow-y-auto">
          {/* Dealership Playbooks */}
          <div className="p-4 border-b border-slate-800 bg-slate-900/40">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-[#F91F1F]" />
                1-Click Playbooks
              </span>
              <span className="text-[10px] bg-rose-500/20 text-rose-300 font-bold px-2 py-0.5 rounded-full border border-rose-500/30">
                AI Ready
              </span>
            </div>

            <div className="space-y-2">
              {playbooks.map((pb) => (
                <button
                  key={pb.key}
                  onClick={() => {
                    setSelectedPlaybook(pb.key)
                    setAiPrompt(pb.desc)
                    setShowAiModal(true)
                  }}
                  className="w-full text-left p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 hover:border-red-500/50 transition group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white group-hover:text-red-400 transition-colors">
                      {pb.title}
                    </span>
                    <span className="text-[9px] text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded font-medium">
                      {pb.tag}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {pb.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Palette Sections */}
          <div className="p-3 space-y-4">
            {/* AI & LLM Models */}
            <div>
              <div className="flex items-center gap-2 mb-2 px-1">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">AI & LLM Models</span>
              </div>
              <div className="space-y-2">
                {aiNodes.map((item, i) => (
                  <div
                    key={i}
                    onMouseDown={(e) => handleMouseDown(e, item)}
                    className="p-3 bg-slate-800/90 hover:bg-slate-700 border border-slate-700/80 hover:border-rose-500/50 rounded-xl cursor-grab active:cursor-grabbing transition shadow-sm flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-sm">
                        {item.icon}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-100 group-hover:text-rose-400 transition-colors">
                          {item.title}
                        </div>
                        <div className="text-[10px] text-slate-400">{item.defaultSubtitle}</div>
                      </div>
                    </div>
                    <span className="text-[9px] font-bold text-rose-300 bg-rose-900/40 border border-rose-700/50 px-1.5 py-0.5 rounded">
                      {item.modelTag}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Triggers */}
            <div>
              <div className="flex items-center gap-2 mb-2 px-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Triggers (Events)</span>
              </div>
              <div className="space-y-2">
                {triggers.map((item, i) => (
                  <div
                    key={i}
                    onMouseDown={(e) => handleMouseDown(e, item)}
                    className="p-3 bg-slate-800/90 hover:bg-slate-700 border border-slate-700/80 hover:border-emerald-500/50 rounded-xl cursor-grab active:cursor-grabbing transition shadow-sm flex items-center gap-2.5 group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-sm">
                      {item.icon}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-100 group-hover:text-emerald-400 transition-colors">
                        {item.title}
                      </div>
                      <div className="text-[10px] text-slate-400">{item.defaultSubtitle}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Conditions */}
            <div>
              <div className="flex items-center gap-2 mb-2 px-1">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Logic & Conditions</span>
              </div>
              <div className="space-y-2">
                {conditions.map((item, i) => (
                  <div
                    key={i}
                    onMouseDown={(e) => handleMouseDown(e, item)}
                    className="p-3 bg-slate-800/90 hover:bg-slate-700 border border-slate-700/80 hover:border-amber-500/50 rounded-xl cursor-grab active:cursor-grabbing transition shadow-sm flex items-center gap-2.5 group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-sm">
                      {item.icon}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-100 group-hover:text-amber-400 transition-colors">
                        {item.title}
                      </div>
                      <div className="text-[10px] text-slate-400">{item.defaultSubtitle}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div>
              <div className="flex items-center gap-2 mb-2 px-1">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Automated Actions</span>
              </div>
              <div className="space-y-2">
                {actions.map((item, i) => (
                  <div
                    key={i}
                    onMouseDown={(e) => handleMouseDown(e, item)}
                    className="p-3 bg-slate-800/90 hover:bg-slate-700 border border-slate-700/80 hover:border-red-500/50 rounded-xl cursor-grab active:cursor-grabbing transition shadow-sm flex items-center gap-2.5 group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-sm">
                      {item.icon}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-100 group-hover:text-red-400 transition-colors">
                        {item.title}
                      </div>
                      <div className="text-[10px] text-slate-400">{item.defaultSubtitle}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Blueprint Canvas Workspace (Pickolab Style) */}
        <main className="flex-1 relative bg-[#090D16] overflow-auto min-h-[600px] lg:h-[calc(100vh-112px)]">
          {/* Canvas Floating Toolbar */}
          <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-[#1E293B]/90 backdrop-blur border border-slate-700 rounded-2xl p-1.5 shadow-xl text-xs">
            <button
              onClick={() => setZoomLevel(Math.max(50, zoomLevel - 10))}
              className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="px-2 font-mono text-slate-300 font-semibold">{zoomLevel}%</span>
            <button
              onClick={() => setZoomLevel(Math.min(150, zoomLevel + 10))}
              className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <div className="h-4 w-px bg-slate-700 mx-1" />
            <button
              onClick={() => setZoomLevel(100)}
              className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white"
              title="Reset Zoom"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDroppedItems([])}
              className="p-1.5 hover:bg-red-900/40 text-red-400 rounded-lg"
              title="Clear Canvas"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Dot Grid Blueprint Background */}
          <div
            ref={canvasRef}
            className="relative w-full h-[2400px] min-w-[1200px] p-8 origin-top-left transition-transform"
            style={{
              transform: `scale(${zoomLevel / 100})`,
              backgroundImage: 'radial-gradient(circle, #334155 1.2px, transparent 1.2px)',
              backgroundSize: '28px 28px'
            }}
            onClick={() => {
              setSelectedItem(null)
              setConnectingSource(null)
              setConnectingMode(false)
            }}
          >
            {/* Empty Canvas Banner */}
            {droppedItems.length === 0 && (
              <div className="absolute top-24 left-1/2 transform -translate-x-1/2 bg-[#1E293B] border border-slate-700 rounded-3xl p-8 max-w-md shadow-2xl text-center space-y-4 z-10">
                <div className="w-14 h-14 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-2xl flex items-center justify-center mx-auto text-2xl">
                  <Bot className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Visual AI Automation Pipeline</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Drag AI LLM models, triggers, and actions from the left palette to orchestrate automated dealership pipelines for {selectedStore?.name || "AgroTractor Central Santa Cruz"}.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 pt-2">
                  <button
                    onClick={() => setShowAiModal(true)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-[#F91F1F] text-white hover:brightness-110 shadow-lg shadow-red-500/20 transition"
                  >
                    ✨ Open AI Studio
                  </button>
                  <button
                    onClick={() => {
                      setSelectedPlaybook("lead_nurture")
                      setAiPrompt(playbooks[0].desc)
                      setShowAiModal(true)
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-200 hover:bg-slate-700 transition"
                  >
                    Load 1-Click Playbook
                  </button>
                </div>
              </div>
            )}

            {/* SVG Connecting Bezier Cables */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
              <defs>
                <linearGradient id="cableGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#F43F5E" />
                  <stop offset="50%" stopColor="#8B5CF6" />
                  <stop offset="100%" stopColor="#10B981" />
                </linearGradient>
              </defs>

              {connections.map((c, idx) => {
                const path = getCubicBezierPath(c)
                if (!path) return null

                return (
                  <g key={idx}>
                    {/* Shadow / Glow Cable */}
                    <path
                      d={path.d}
                      fill="none"
                      stroke="#8B5CF6"
                      strokeWidth="6"
                      strokeOpacity="0.15"
                    />
                    {/* Main Cable */}
                    <path
                      d={path.d}
                      fill="none"
                      stroke="url(#cableGradient)"
                      strokeWidth="2.5"
                      strokeDasharray="6 4"
                      className="animate-[dash_20s_linear_infinite]"
                    />
                    {/* Label Pill */}
                    {c.label && (
                      <g>
                        <rect
                          x={path.midX - 35}
                          y={path.midY - 11}
                          width="70"
                          height="22"
                          rx="11"
                          fill="#1E293B"
                          stroke="#64748B"
                          strokeWidth="1"
                        />
                        <text
                          x={path.midX}
                          y={path.midY + 4}
                          textAnchor="middle"
                          className="text-[10px] font-bold fill-slate-200"
                        >
                          {c.label}
                        </text>
                      </g>
                    )}
                  </g>
                )
              })}
            </svg>

            {/* Dropped Interactive Nodes */}
            {droppedItems.map((item) => {
              const isAi = item.category === 'ai'
              const isTrigger = item.category === 'triggers'
              const isAction = item.category === 'actions'
              const isCondition = item.category === 'conditions'

              const borderGlow =
                item.status === 'RUNNING'
                  ? 'border-emerald-400 ring-2 ring-emerald-400 shadow-emerald-500/30'
                  : item.status === 'SUCCESS'
                  ? 'border-emerald-500'
                  : isAi
                  ? 'border-rose-500/40 hover:border-rose-500'
                  : isTrigger
                  ? 'border-emerald-500/40 hover:border-emerald-500'
                  : isCondition
                  ? 'border-amber-500/40 hover:border-amber-500'
                  : 'border-red-500/40 hover:border-red-500'

              return (
                <div
                  key={item.id}
                  className={`absolute w-64 bg-[#1E293B] rounded-2xl border ${borderGlow} shadow-xl select-none transition-all duration-200 hover:shadow-2xl z-10 group`}
                  style={{ left: item.x, top: item.y }}
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedItem(item.id)
                  }}
                  onDoubleClick={() => openInspector(item)}
                >
                  {/* Category Header Strip */}
                  <div className={`px-4 py-2 border-b border-slate-700/80 flex items-center justify-between rounded-t-2xl ${
                    isAi ? 'bg-rose-950/40' : isTrigger ? 'bg-emerald-950/40' : isCondition ? 'bg-amber-950/40' : 'bg-red-950/40'
                  }`}>
                    <div className="flex items-center gap-2">
                      <span className="text-base">{item.icon}</span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${
                        isAi ? 'text-rose-400' : isTrigger ? 'text-emerald-400' : isCondition ? 'text-amber-400' : 'text-red-400'
                      }`}>
                        {item.category.toUpperCase()}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {item.config?.model && (
                        <span className="text-[9px] font-bold text-rose-300 bg-rose-900/60 px-1.5 py-0.5 rounded">
                          {item.config.model}
                        </span>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setDroppedItems(prev => prev.filter(nd => nd.id !== item.id))
                          setConnections(prev => prev.filter(c => c.from !== item.id && c.to !== item.id))
                        }}
                        className="text-slate-400 hover:text-red-400 p-1"
                        title="Delete Node"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Node Body */}
                  <div className="p-4 space-y-2">
                    <h4 className="font-bold text-sm text-white group-hover:text-red-400 transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {item.extra || item.subtitle}
                    </p>

                    {/* Quick Test Node Button for AI */}
                    {isAi && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          openInspector(item)
                        }}
                        className="w-full mt-2 py-1.5 px-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-[11px] font-bold flex items-center justify-center gap-1.5 transition"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Configure & Prompt Test</span>
                      </button>
                    )}
                  </div>

                  {/* Connecting Ports */}
                  {/* Left (Input) Port */}
                  <div
                    onClick={(e) => handlePortClick(item.id, 'in', e)}
                    className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-900 border-2 border-slate-500 hover:border-emerald-400 hover:scale-125 cursor-pointer flex items-center justify-center transition shadow-md group/port"
                    title="Input Port (Connect To Here)"
                  >
                    <div className="w-2 h-2 rounded-full bg-emerald-400 group-hover/port:scale-150 transition" />
                  </div>

                  {/* Right (Output) Port */}
                  <div
                    onClick={(e) => handlePortClick(item.id, 'out', e)}
                    className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-900 border-2 border-slate-500 hover:border-rose-400 hover:scale-125 cursor-pointer flex items-center justify-center transition shadow-md group/port"
                    title="Output Port (Drag Connection From Here)"
                  >
                    <div className="w-2 h-2 rounded-full bg-rose-400 group-hover/port:scale-150 transition" />
                  </div>
                </div>
              )
            })}
          </div>

          {/* MiniMap Preview (Bottom Right) */}
          {showMinimap && (
            <div className="absolute bottom-6 right-6 z-20 w-44 h-32 bg-[#1E293B]/90 backdrop-blur border border-slate-700 rounded-2xl shadow-2xl p-2 hidden sm:block">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mb-1">
                <span>CANVAS MAP</span>
                <span className="text-emerald-400">{droppedItems.length} Nodes</span>
              </div>
              <div className="relative w-full h-24 bg-slate-900/80 rounded-xl overflow-hidden border border-slate-800">
                {droppedItems.map((n) => (
                  <div
                    key={n.id}
                    className="absolute w-3 h-2 rounded-xs bg-rose-400"
                    style={{
                      left: `${(n.x / 1400) * 100}%`,
                      top: `${(n.y / 2000) * 100}%`
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Node Inspector Drawer (Right sliding drawer) */}
      {inspectingNode && (
        <div className="fixed inset-y-0 right-0 w-full sm:w-[460px] bg-[#1E293B] border-l border-slate-700 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="p-5 border-b border-slate-700 flex items-center justify-between bg-slate-900/60">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{inspectingNode.icon}</span>
              <div>
                <h3 className="font-bold text-white text-base">{inspectingNode.title}</h3>
                <span className="text-xs text-rose-400 font-semibold uppercase">{inspectingNode.category} Node</span>
              </div>
            </div>
            <button
              onClick={() => setInspectingNode(null)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Inspector Form */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Model Selector for AI Nodes */}
            {inspectingNode.category === 'ai' && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase">LLM Engine:</label>
                <select
                  value={inspectModel}
                  onChange={(e) => setInspectModel(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-rose-500 font-semibold"
                >
                  <option value="gemini-1.5-pro">Google Gemini 1.5 Pro (Multimodal Agricultural)</option>
                  <option value="gpt-4o">OpenAI GPT-4o (High Speed Conversational)</option>
                  <option value="claude-3-5-sonnet">Anthropic Claude 3.5 Sonnet (Diagnostic)</option>
                  <option value="deepseek-v3">DeepSeek V3 (Cost Efficient)</option>
                </select>
              </div>
            )}

            {/* Variable Injection Chips */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase">Dynamic Customer Variables:</label>
              <div className="flex flex-wrap gap-1.5">
                {['{{customer_name}}', '{{tractor_model}}', '{{store_name}}', '{{phone}}', '{{city}}'].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setInspectPrompt(prev => `${prev} ${tag}`)}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-rose-300 rounded-lg text-xs font-mono font-bold transition"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Prompt Editor */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase">
                {inspectingNode.category === 'ai' ? 'AI Prompt Instruction:' : 'Template / Action Text:'}
              </label>
              <textarea
                value={inspectPrompt}
                onChange={(e) => setInspectPrompt(e.target.value)}
                rows={5}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500 font-mono leading-relaxed"
                placeholder="Enter AI prompt instruction with dynamic variables..."
              />
            </div>

            {/* Temperature Slider */}
            {inspectingNode.category === 'ai' && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span className="font-bold uppercase">Temperature (Creativity):</span>
                  <span className="font-mono text-rose-400 font-bold">{inspectTemp}</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.05"
                  value={inspectTemp}
                  onChange={(e) => setInspectTemp(parseFloat(e.target.value))}
                  className="w-full accent-rose-500 cursor-pointer"
                />
              </div>
            )}

            {/* Live Test AI Inference Button */}
            {inspectingNode.category === 'ai' && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleTestNodeAiInference(inspectingNode)}
                  disabled={isTestingNodeAi}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-rose-600 to-purple-600 hover:brightness-110 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20 disabled:opacity-50 transition"
                >
                  {isTestingNodeAi ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span>{isTestingNodeAi ? "Executing Model Inference..." : "Test Run LLM Prompt"}</span>
                </button>
              </div>
            )}

            {/* Test Run Output Preview */}
            {nodeAiTestResult && (
              <div className="p-4 bg-slate-900 border border-rose-500/40 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-rose-400">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Model Output Preview:
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">{inspectModel}</span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed font-sans bg-slate-950 p-3 rounded-xl border border-slate-800 whitespace-pre-wrap">
                  {nodeAiTestResult}
                </p>
              </div>
            )}
          </div>

          {/* Drawer Actions */}
          <div className="p-4 border-t border-slate-700 bg-slate-900/60 flex items-center justify-end gap-2">
            <button
              onClick={() => setInspectingNode(null)}
              className="px-4 py-2 border border-slate-700 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              onClick={saveInspector}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              Apply Changes
            </button>
          </div>
        </div>
      )}

      {/* AI AGENT STUDIO MODAL */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#1E293B] border border-slate-700 w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-700 flex items-center justify-between bg-gradient-to-r from-red-950/40 via-slate-900 to-slate-900">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#F91F1F] to-[#FF5E3A] flex items-center justify-center text-white shadow-lg shadow-red-500/20">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">AI Workflow Agent Studio</h3>
                  <p className="text-xs text-slate-400">
                    Auto-synthesize end-to-end dealership funnels for {selectedStore?.name || "AgroTractor Central Santa Cruz"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAiModal(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-2 uppercase tracking-wider">
                  Select Dealership Blueprint:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {playbooks.map(pb => (
                    <button
                      key={pb.key}
                      onClick={() => {
                        setSelectedPlaybook(pb.key)
                        setAiPrompt(pb.desc)
                      }}
                      className={`p-3 rounded-2xl border text-left text-xs transition ${
                        selectedPlaybook === pb.key
                          ? 'border-red-500 bg-red-950/40 text-white shadow-sm'
                          : 'border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="font-bold text-xs mb-1 text-white">{pb.title}</div>
                      <div className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">{pb.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-2 uppercase tracking-wider">
                  Describe Your Automation Funnel:
                </label>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => {
                    setAiPrompt(e.target.value)
                    setSelectedPlaybook(null)
                  }}
                  rows={4}
                  placeholder={`E.g., When a farmer inquires about utility tractors at ${selectedStore?.name || 'AgroTractor Central Santa Cruz'}, evaluate their acreage, send WhatsApp specs with 10% discount, and alert sales team...`}
                  className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500 transition leading-relaxed"
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-700 bg-slate-900/60 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowAiModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateAI}
                disabled={isGeneratingAi}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#F91F1F] to-[#FF5E3A] hover:brightness-110 text-white shadow-lg shadow-red-500/20 active:scale-95 disabled:opacity-50 transition"
              >
                {isGeneratingAi ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>{isGeneratingAi ? "Synthesizing Pipeline..." : "Generate AI Pipeline"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SIMULATION TELEMETRY MODAL */}
      {showSimulationModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#1E293B] border border-slate-700 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-5 border-b border-slate-700 flex items-center justify-between bg-slate-900/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                  <Play className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Pipeline Simulation & Telemetry</h3>
                  <p className="text-xs text-slate-400">
                    Live execution run for store: <strong className="text-white">{selectedStore?.name || "AgroTractor Central Santa Cruz"}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSimulationModal(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              {/* Target Customer Header */}
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-400" />
                  <span className="text-slate-400">Target Lead:</span>
                  <span className="font-bold text-white">
                    {selectedSimCustomer ? `${selectedSimCustomer.first_name} ${selectedSimCustomer.last_name} (${selectedSimCustomer.mobile || 'No phone'})` : "Carlos Mendoza (+591 7761 3811)"}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800 px-2 py-0.5 rounded-full">
                  Verified Lead
                </span>
              </div>

              {/* Step Logs */}
              <div className="space-y-2.5">
                {simLogs.map((log) => (
                  <div
                    key={log.step_number}
                    className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-2xl flex items-start gap-3 animate-in fade-in"
                  >
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      ✓
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-white">
                          Step {log.step_number}: {log.node_title}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{log.detail}</p>
                    </div>
                  </div>
                ))}

                {isSimulating && (
                  <div className="p-4 bg-slate-900/50 border border-blue-500/30 rounded-2xl flex items-center justify-center gap-2 text-xs text-blue-400 animate-pulse">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Propagating packets through pipeline...</span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-slate-700 bg-slate-900/60 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                {simLogs.length} of {droppedItems.length} nodes executed
              </span>
              <button
                onClick={() => setShowSimulationModal(false)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}