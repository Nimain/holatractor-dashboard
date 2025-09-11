"use client"
import React, { useState, useRef, useCallback } from 'react'

interface SidebarItemType {
  icon: string
  title: string
  category: 'triggers' | 'conditions' | 'actions'
}

interface DroppedItem {
  id: number
  type: string
  icon: string
  title: string
  subtitle: string
  x: number
  y: number
  category: 'triggers' | 'conditions' | 'actions'
  extra?: string
  connections?: number[]
}

interface Connection {
  from: number
  to: number
  label?: string
  color?: 'red' | 'blue' | 'green'
}

interface DragState {
  isDragging: boolean
  draggedItem: SidebarItemType | null
  offset: { x: number; y: number }
  mousePosition: { x: number; y: number }
}

const AutomationWorkflow: React.FC = () => {
  const [droppedItems, setDroppedItems] = useState<DroppedItem[]>([
    { 
      id: 1, 
      type: 'trigger', 
      icon: '📋', 
      title: 'Added to List', 
      subtitle: 'Conference Leads', 
      x: 32, 
      y: 32, 
      category: 'triggers',
      connections: [2]
    }
  ])
  
  const [connections, setConnections] = useState<Connection[]>([])
  const [selectedItem, setSelectedItem] = useState<number | null>(null)
  const [connectingMode, setConnectingMode] = useState<boolean>(false)
  
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedItem: null,
    offset: { x: 0, y: 0 },
    mousePosition: { x: 0, y: 0 }
  })
  
  const canvasRef = useRef<HTMLDivElement>(null)

  const triggers: SidebarItemType[] = [
    { icon: "📋", title: "Added to List", category: "triggers" },
    { icon: "📅", title: "Date and Time", category: "triggers" },
    { icon: "⏰", title: "Smart Segment", category: "triggers" },
    { icon: "🔄", title: "Record Updated", category: "triggers" },
    { icon: "🏷️", title: "Field Matched", category: "triggers" },
    { icon: "📧", title: "Email Activity", category: "triggers" },
  ]

  const conditions: SidebarItemType[] = [
    { icon: "📧", title: "Check Email Status", category: "conditions" },
    { icon: "📋", title: "Is In List", category: "conditions" },
    { icon: "👤", title: "Check Contact Field", category: "conditions" },
    { icon: "💰", title: "Check Deal Field", category: "conditions" },
    { icon: "👁️", title: "Has visited page", category: "conditions" },
    { icon: "✅", title: "Check Activity Field", category: "conditions" },
  ]

  const actions: SidebarItemType[] = [
    { icon: "📧", title: "Send Mail", category: "actions" },
    { icon: "👤", title: "Contact Field Update", category: "actions" },
    { icon: "⏰", title: "Add Delay", category: "actions" },
    { icon: "💰", title: "Deal Create", category: "actions" },
    { icon: "🔄", title: "A/B Split", category: "actions" },
    { icon: "✅", title: "Activity Field Update", category: "actions" },
  ]

  const handleMouseDown = useCallback((e: React.MouseEvent, item: SidebarItemType) => {
    e.preventDefault()
    const rect = e.currentTarget.getBoundingClientRect()
    
    setDragState({
      isDragging: true,
      draggedItem: item,
      offset: {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      },
      mousePosition: { x: e.clientX, y: e.clientY }
    })
  }, [])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragState.isDragging) return
    
    setDragState(prev => ({
      ...prev,
      mousePosition: { x: e.clientX, y: e.clientY }
    }))
  }, [dragState.isDragging])

  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (!dragState.isDragging || !dragState.draggedItem || !canvasRef.current) {
      setDragState({
        isDragging: false,
        draggedItem: null,
        offset: { x: 0, y: 0 },
        mousePosition: { x: 0, y: 0 }
      })
      return
    }

    const canvasRect = canvasRef.current.getBoundingClientRect()
    
    // Check if mouse is over canvas
    if (
      e.clientX >= canvasRect.left &&
      e.clientX <= canvasRect.right &&
      e.clientY >= canvasRect.top &&
      e.clientY <= canvasRect.bottom
    ) {
      // Calculate position relative to canvas
      const x = e.clientX - canvasRect.left - 144 // Center the block
      const y = e.clientY - canvasRect.top - 32
      
      const newItem: DroppedItem = {
        id: Date.now(),
        type: dragState.draggedItem.category.slice(0, -1),
        icon: dragState.draggedItem.icon,
        title: dragState.draggedItem.title,
        subtitle: getDefaultSubtitle(dragState.draggedItem.title),
        x: Math.max(0, Math.min(x, canvasRect.width - 288)), // Keep within bounds
        y: Math.max(0, Math.min(y, canvasRect.height - 80)),
        category: dragState.draggedItem.category
      }
      
      setDroppedItems(prev => [...prev, newItem])
    }

    setDragState({
      isDragging: false,
      draggedItem: null,
      offset: { x: 0, y: 0 },
      mousePosition: { x: 0, y: 0 }
    })
  }, [dragState])

  // Add global mouse event listeners
  React.useEffect(() => {
    if (dragState.isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'grabbing'
      document.body.style.userSelect = 'none'
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }
    }
  }, [dragState.isDragging, handleMouseMove, handleMouseUp])

  const getDefaultSubtitle = (title: string): string => {
    const subtitles: Record<string, string> = {
      "Added to List": "Select a list",
      "Date and Time": "Set date/time",
      "Smart Segment": "Configure segment",
      "Record Updated": "Choose record type",
      "Field Matched": "Select field",
      "Email Activity": "Choose activity",
      "Check Email Status": "Set conditions",
      "Is In List": "Select list",
      "Check Contact Field": "Choose field",
      "Check Deal Field": "Select deal field",
      "Has visited page": "Enter URL",
      "Check Activity Field": "Choose activity",
      "Send Mail": "Compose email",
      "Contact Field Update": "Select field to update",
      "Add Delay": "Set delay time",
      "Deal Create": "Configure deal",
      "A/B Split": "Set split ratio",
      "Activity Field Update": "Choose activity"
    }
    return subtitles[title] || "Configure"
  }

  const handleItemClick = (id: number, e: React.MouseEvent): void => {
    e.stopPropagation()
    
    if (connectingMode) {
      if (selectedItem && selectedItem !== id) {
        // Create connection
        const newConnection: Connection = {
          from: selectedItem,
          to: id,
          color: 'red'
        }
        setConnections(prev => [...prev, newConnection])
        setSelectedItem(null)
        setConnectingMode(false)
      } else {
        setSelectedItem(id)
      }
    } else {
      // Toggle selection or remove item
      if (selectedItem === id) {
        setDroppedItems(prev => prev.filter(item => item.id !== id))
        setConnections(prev => prev.filter(conn => conn.from !== id && conn.to !== id))
        setSelectedItem(null)
      } else {
        setSelectedItem(id)
      }
    }
  }

  const startConnecting = () => {
    setConnectingMode(true)
    setSelectedItem(null)
  }

  const cancelConnecting = () => {
    setConnectingMode(false)
    setSelectedItem(null)
  }

  // Calculate arrow path between two items
  const calculateArrowPath = (fromItem: DroppedItem, toItem: DroppedItem, connection: Connection) => {
    const fromCenter = {
      x: fromItem.x + 144, // half width of block
      y: fromItem.y + 40   // half height of block
    }
    const toCenter = {
      x: toItem.x + 144,
      y: toItem.y + 40
    }

    // Simple straight line for now
    return {
      x1: fromCenter.x,
      y1: fromCenter.y,
      x2: toCenter.x,
      y2: toCenter.y,
      midX: (fromCenter.x + toCenter.x) / 2,
      midY: (fromCenter.y + toCenter.y) / 2
    }
  }

  const ArrowComponent: React.FC<{ connection: Connection }> = ({ connection }) => {
    const fromItem = droppedItems.find(item => item.id === connection.from)
    const toItem = droppedItems.find(item => item.id === connection.to)
    
    if (!fromItem || !toItem) return null
    
    const path = calculateArrowPath(fromItem, toItem, connection)
    const color = connection.color === 'blue' ? '#3B82F6' : '#EF4444'
    
    return (
      <g>
        {/* Arrow line */}
        <line
          x1={path.x1}
          y1={path.y1}
          x2={path.x2}
          y2={path.y2}
          stroke={color}
          strokeWidth="3"
          markerEnd="url(#arrowhead)"
        />
        
        {/* Arrow head */}
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon
              points="0 0, 10 3.5, 0 7"
              fill={color}
            />
          </marker>
        </defs>
        
        {/* Label if exists */}
        {connection.label && (
          <g>
            <rect
              x={path.midX - 25}
              y={path.midY - 12}
              width="50"
              height="24"
              rx="12"
              fill={connection.color === 'blue' ? '#DBEAFE' : '#FEE2E2'}
              stroke={color}
              strokeWidth="2"
            />
            <text
              x={path.midX}
              y={path.midY + 4}
              textAnchor="middle"
              className="text-xs font-medium"
              fill={color}
            >
              {connection.label}
            </text>
          </g>
        )}
      </g>
    )
  }

  const SidebarItem: React.FC<SidebarItemType> = ({ icon, title, category }) => (
    <div 
      className="bg-red-800 rounded-lg p-3 text-center cursor-grab hover:bg-red-700 transition-colors active:cursor-grabbing select-none"
      onMouseDown={(e) => handleMouseDown(e, { icon, title, category })}
    >
      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mx-auto mb-2">
        <span className="text-red-800 text-sm">{icon}</span>
      </div>
      <div className="text-xs font-medium leading-tight">{title}</div>
    </div>
  )

  const getBlockColor = (category: 'triggers' | 'conditions' | 'actions'): string => {
    const colors: Record<string, string> = {
      triggers: 'bg-green-800',
      conditions: 'bg-yellow-800', 
      actions: 'bg-red-900'
    }
    return colors[category] || 'bg-gray-800'
  }

  return (
    <div className="min-h-screen  bg-gray-200 p-4 relative">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h1 className="text-red-600 text-3xl font-bold mb-1">Automation</h1>
          <h2 className="text-red-600 text-lg">Distribute Leads Between your teammates</h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={startConnecting}
            className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
              connectingMode 
                ? 'bg-blue-600 text-white' 
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {connectingMode ? 'Connecting...' : 'Connect'}
          </button>
          {connectingMode && (
            <button
              onClick={cancelConnecting}
              className="bg-gray-500 text-white px-4 py-1.5 rounded text-sm font-medium hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          )}
          {(["Publish", "Save", "Cancel"] as const).map((btn) => (
            <button
              key={btn}
              className="bg-orange-500 text-white px-4 py-1.5 rounded text-sm font-medium hover:bg-orange-600 transition-colors"
            >
              {btn}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-4">
        {/* Sidebar */}
        <div className="w-72 bg-gradient-to-b from-red-900 to-red-950 text-white">
          <div className="p-4">
            <div className="text-lg font-bold mb-4">Triggers</div>
            <div className="grid grid-cols-3 gap-3 mb-6">
              {triggers.map((item, i) => (
                <SidebarItem key={i} {...item} />
              ))}
            </div>

            <div className="text-lg font-bold mb-4">Conditions</div>
            <div className="grid grid-cols-3 gap-3 mb-6">
              {conditions.map((item, i) => (
                <SidebarItem key={i} {...item} />
              ))}
            </div>

            <div className="text-lg font-bold mb-4">Actions</div>
            <div className="grid grid-cols-3 gap-3">
              {actions.map((item, i) => (
                <SidebarItem key={i} {...item} />
              ))}
            </div>
          </div>
        </div>

        {/* Main Workflow Canvas */}
        <div 
          ref={canvasRef}
          className={`flex-1 bg-white relative border-2 border-dashed ${dragState.isDragging ? 'border-blue-400 bg-blue-50' : 'border-gray-300'} transition-all duration-200 overflow-hidden`}
          style={{ minHeight: "600px" }}
          onClick={() => {
            if (connectingMode) {
              cancelConnecting()
            }
          }}
        >
          {droppedItems.length === 1 ? (
            <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-lg pointer-events-none">
              Drag items from the sidebar to build your workflow
            </div>
          ) : null}

          {/* SVG for arrows */}
          <svg 
            className="absolute inset-0 w-full h-full pointer-events-none" 
            style={{ zIndex: 1 }}
          >
            {connections.map((connection, index) => (
              <ArrowComponent key={index} connection={connection} />
            ))}
          </svg>

          {/* Dropped Workflow Blocks */}
          {droppedItems.map((item) => (
            <div
              key={item.id}
              className={`absolute cursor-pointer transform hover:scale-105 transition-transform ${
                selectedItem === item.id ? 'ring-4 ring-blue-400 ring-opacity-60' : ''
              }`}
              style={{ left: item.x, top: item.y, zIndex: 2 }}
              onClick={(e) => handleItemClick(item.id, e)}
              title={connectingMode ? "Click to connect" : "Click to select/remove"}
            >
              <WorkflowBlock 
                title={item.title}
                subtitle={item.subtitle}
                icon={item.icon}
                category={item.category}
                extra={item.extra}
                isSelected={selectedItem === item.id}
                isConnecting={connectingMode}
              />
            </div>
          ))}

          {dragState.isDragging && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="bg-blue-100 border-2 border-blue-400 rounded-lg p-4 text-blue-600 font-medium animate-pulse">
                Drop here to add to workflow
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dragging Preview */}
      {dragState.isDragging && dragState.draggedItem && (
        <div
          className="fixed pointer-events-none z-50 opacity-80"
          style={{
            left: dragState.mousePosition.x - dragState.offset.x,
            top: dragState.mousePosition.y - dragState.offset.y,
            transform: 'rotate(5deg)'
          }}
        >
          <WorkflowBlock
            title={dragState.draggedItem.title}
            subtitle={getDefaultSubtitle(dragState.draggedItem.title)}
            icon={dragState.draggedItem.icon}
            category={dragState.draggedItem.category}
          />
        </div>
      )}

      {/* Instructions */}
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-bold text-blue-800 mb-2">How to use:</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• <strong>Click and drag</strong> items from the left sidebar onto the white canvas</li>
          <li>• <strong>Click "Connect"</strong> button to enter connection mode</li>
          <li>• <strong>Click two blocks</strong> in sequence to connect them with arrows</li>
          <li>• Triggers (green) start your workflow</li>
          <li>• Conditions (yellow) add logic and branching</li>
          <li>• Actions (red) perform tasks</li>
          <li>• <strong>Click a selected item again</strong> to remove it</li>
          {connectingMode && (
            <li className="text-blue-900 font-semibold">• Connection mode active - click two blocks to connect them</li>
          )}
        </ul>
      </div>
    </div>
  )
}

// Reusable Block Component
interface WorkflowBlockProps {
  title: string
  subtitle: string
  icon: string
  category: 'triggers' | 'conditions' | 'actions'
  extra?: string
  isSelected?: boolean
  isConnecting?: boolean
}

const WorkflowBlock: React.FC<WorkflowBlockProps> = ({
  title,
  subtitle,
  extra,
  icon,
  category,
  isSelected = false,
  isConnecting = false
}) => {
  const getBlockColor = (category: 'triggers' | 'conditions' | 'actions'): string => {
    const colors: Record<string, string> = {
      triggers: 'bg-green-800',
      conditions: 'bg-yellow-800', 
      actions: 'bg-red-900'
    }
    return colors[category] || 'bg-gray-800'
  }

  return (
    <div className={`${getBlockColor(category)} rounded-lg p-4 text-white shadow-lg flex items-center gap-3 w-72 relative hover:shadow-xl transition-all duration-200 ${
      isSelected ? 'ring-4 ring-blue-400 ring-opacity-60 scale-105' : ''
    } ${isConnecting ? 'hover:ring-2 hover:ring-yellow-400' : ''}`}>
      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center flex-shrink-0">
        <span className="text-gray-800 text-lg">{icon}</span>
      </div>
      <div>
        <div className="font-bold text-base">{title}</div>
        <div className="text-sm opacity-90">{subtitle}</div>
        {extra && <div className="text-sm opacity-90">{extra}</div>}
      </div>
      {!isConnecting && isSelected && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-sm transition-opacity">
          ×
        </div>
      )}
      {isConnecting && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-white text-sm animate-pulse">
          +
        </div>
      )}
    </div>
  )
}

export default AutomationWorkflow