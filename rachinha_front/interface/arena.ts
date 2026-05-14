export interface Location {
    cep?: string;
    street?: string;
    complementary?: string;
    unit?: string;
    neighborhood?: string;
    city?: string;
    uf?: string;
    state?: string;
    region?: string;
    ibge?: string;
    gia?: string;
    ddd?: string;
    siafi?: string;
    latitude?: number;
    longitude?: number;
    alt?: string;
}

export interface Arena {
    id: string;
    name: string;
    is_active: boolean;
    photos_url: string[];
    location: Location;
    description?: string;
}

export interface ArenaCreate {
    name: string;
    is_active: boolean;
    photos_url: string[];
    location: Location;
    description?: string;
}

export interface ArenaUpdate {
    name?: string;
    description?: string;
    is_active?: boolean;
    photos_url?: string[];
    location?: Location;
}
