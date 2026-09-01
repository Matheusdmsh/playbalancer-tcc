"use client"

interface SportCategoriesProps {
  selectedSport?: string
  onSelectSport?: (sport: string) => void
}

const sports = [
  {
    name: "Vôlei",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M7 8C8.5 9.67 10.5 11 12 11C13.5 11 15.5 9.67 17 8"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M5 12C7.5 14.5 10 15 12 15C14 15 16.5 14.5 19 12"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M7 17C8.5 15.33 10.5 14 12 14C13.5 14 15.5 15.33 17 17"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    name: "Basquete",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
        <path d="M12 2V22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M2 12H22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path
          d="M19.5 5C17.5 7.5 14 9 12 9C10 9 6.5 7.5 4.5 5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M4.5 19C6.5 16.5 10 15 12 15C14 15 17.5 16.5 19.5 19"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    name: "Badminton",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M10 18L14 14L17 17L13 21L10 18Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M14 14L16.5 11.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M5 5L11 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path
          d="M15 3L7 11L11 15L19 7L15 3Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    name: "Futebol",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M12 15L9 18H15L12 15Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M9 18L7 12L12 15L17 12L15 18"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M12 15V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path
          d="M12 9L7 12L9 6H15L17 12L12 9Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    name: "Golfe",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 18V3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 3L18 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 3L6 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M18 18H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M18 21H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    name: "Boliche",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="9" cy="7" r="1" fill="currentColor" />
        <circle cx="15" cy="7" r="1" fill="currentColor" />
        <circle cx="12" cy="11" r="1" fill="currentColor" />
      </svg>
    ),
  },
  {
    name: "Natação",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M3 16.5L5 17.5L7 16.5L9 17.5L11 16.5L13 17.5L15 16.5L17 17.5L19 16.5L21 17.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M3 20.5L5 21.5L7 20.5L9 21.5L11 20.5L13 21.5L15 20.5L17 21.5L19 20.5L21 21.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="7" cy="8" r="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M16 8L9 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M16 8L19 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    name: "Futsal",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
        <path d="M5 12H19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 5V19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path
          d="M12 22C14.2091 22 16 17.5228 16 12C16 6.47715 14.2091 2 12 2C9.79086 2 8 6.47715 8 12C8 17.5228 9.79086 22 12 22Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M2 12C2 14.2091 6.47715 16 12 16C17.5228 16 22 14.2091 22 12C22 9.79086 17.5228 8 12 8C6.47715 8 2 9.79086 2 12Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    name: "Tênis de mesa",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
        <path d="M18 5L14 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M16 4L20 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="9" cy="10" r="4" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    name: "Handebol",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="7" cy="7" r="2" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M16 18L12 15L8 18V9L12 6L16 9V18Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M8 9L12 12L16 9"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M12 12V18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    name: "Tênis",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M18 4C16.5 6 15.5 8 15.5 12C15.5 16 16.5 18 18 20"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M6 4C7.5 6 8.5 8 8.5 12C8.5 16 7.5 18 6 20"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M2 12H22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    name: "Vôlei de praia",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="12" cy="6" r="2" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="7" cy="12" r="2" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="17" cy="12" r="2" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="12" cy="18" r="2" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
]

export function SportCategories({ selectedSport, onSelectSport }: SportCategoriesProps) {
  return (
    <div className="overflow-x-auto py-4 scrollbar-hide">
      <div className="flex space-x-6 min-w-max px-1 lg:justify-center lg:min-w-0 lg:w-full">
        {sports.map((sport, index) => {
          const isActive = selectedSport === sport.name
          return (
            <button
              key={index}
              onClick={() => onSelectSport?.(sport.name)}
              className="flex flex-col items-center gap-2 group focus:outline-none"
            >
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-full transition-all ${
                  isActive
                    ? "bg-green-500/20 ring-2 ring-green-500 text-green-400"
                    : "bg-zinc-900 text-white group-hover:bg-zinc-800 group-hover:text-green-400"
                }`}
              >
                {sport.icon}
              </div>
              <span
                className={`text-xs text-center whitespace-nowrap transition-colors ${
                  isActive ? "text-green-400 font-medium" : "text-zinc-400 group-hover:text-zinc-200"
                }`}
              >
                {sport.name}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
