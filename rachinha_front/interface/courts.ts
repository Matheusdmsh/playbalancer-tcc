// Define a estrutura para as horas de funcionamento
export interface AvailableHour {
    day_of_week: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
    start_time: string; // Formato "HH:MM:SS"
    end_time: string;   // Formato "HH:MM:SS"
}

// A interface principal da Quadra, como recebida do backend
export interface Court {
    id: string;
    _id: string; // O backend envia _id
    name: string;
    sports_supported: string[];
    value_per_hour: number;
    value_per_half_hour?: number;
    description: string;
    photos_url: string[];
    characteristics: string[];
    capacity?: number;
    is_active: boolean;
    belong_arena: string;
    available_hours: AvailableHour[];
}

// Interface para criar uma nova quadra
export interface CourtCreate {
    name: string;
    sports_supported: string[];
    value_per_hour: number;
    value_per_half_hour?: number;
    description: string;
    photos_url: string[];
    characteristics: string[];
    capacity?: number;
    is_active: boolean;
    belong_arena: string;
    available_hours: AvailableHour[];
}

// Interface para atualizar uma quadra existente (todos os campos são opcionais)
export type CourtUpdate = Partial<CourtCreate>;

