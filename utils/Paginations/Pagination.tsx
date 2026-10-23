import { ChevronLeft, ChevronRight } from "lucide-react"

type PaginationProps = {
  totalPages: number
  currentPage: number
  onPageChange: (page: number) => void
}

function PaginationNumber({
  page,
  isActive,
  position,
  onPageChange,
}: {
  page: number | string
  position?: "first" | "last" | "middle" | "single"
  isActive: boolean
  onPageChange: (page: number) => void
}) {
  const className = `flex h-10 w-10 items-center justify-center text-sm transition-colors rounded ${
    position === "first" || position === "single" ? "rounded-l-md" : ""
  } ${position === "last" || position === "single" ? "rounded-r-md" : ""} ${
    isActive
      ? "z-10 bg-primary text-primary-foreground"
      : "bg-background text-foreground/60 hover:bg-accent hover:text-accent-foreground"
  } ${position === "middle" || typeof page === "string" ? "text-foreground/60" : ""}`

  const handleClick = () => {
    if (typeof page === "number" && !isActive) {
      onPageChange(page)
    }
  }

  return isActive || position === "middle" || typeof page === "string" ? (
    <span className={className}>{page}</span>
  ) : (
    <button className={className} onClick={handleClick}>
      {page}
    </button>
  )
}

function PaginationArrow({
  direction,
  isDisabled,
  onPageChange,
  currentPage,
}: {
  direction: "left" | "right"
  isDisabled?: boolean
  onPageChange: (page: number) => void
  currentPage: number
}) {
  const className = `flex h-10 w-10 items-center justify-center rounded-md bg-background text-foreground/60 transition-colors hover:bg-accent hover:text-accent-foreground ${
    isDisabled ? "pointer-events-none opacity-50" : ""
  }`

  const icon = direction === "left" ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />

  const handleClick = () => {
    if (!isDisabled) {
      onPageChange(direction === "left" ? currentPage - 1 : currentPage + 1)
    }
  }

  return (
    <button className={className} onClick={handleClick} disabled={isDisabled}>
      {icon}
    </button>
  )
}

export default function Pagination({ totalPages, currentPage, onPageChange }: PaginationProps) {
  const generatePagination = (currentPage: number, totalPages: number) => {
    if (totalPages <= 1) {
      return []
    }

    const totalNumbers = 3
    const startPage = Math.max(1, currentPage - 1)
    const endPage = Math.min(totalPages, currentPage + 1)

    const pages: (number | string)[] = []

    if (startPage > 1) {
      pages.push(1)
      if (startPage > 2) {
        pages.push("...")
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push("...")
      }
      pages.push(totalPages)
    }

    return pages
  }

  const pages = generatePagination(currentPage, totalPages)

  return (
    <nav className="mx-auto flex w-full justify-center mb-4">
      <ul className="flex items-center gap-1">
        <PaginationArrow
          direction="left"
          isDisabled={currentPage <= 1}
          onPageChange={onPageChange}
          currentPage={currentPage}
        />

        {pages.map((page, index) => {
          let position: "first" | "last" | "single" | "middle" | undefined

          if (index === 0) position = "first"
          if (index === pages.length - 1) position = "last"
          if (pages.length === 1) position = "single"
          if (page === "...") position = "middle"

          return (
            <PaginationNumber
              key={page}
              page={page}
              position={position}
              isActive={currentPage === page}
              onPageChange={onPageChange}
            />
          )
        })}

        <PaginationArrow
          direction="right"
          isDisabled={currentPage >= totalPages}
          onPageChange={onPageChange}
          currentPage={currentPage}
        />
      </ul>
    </nav>
  )
}

