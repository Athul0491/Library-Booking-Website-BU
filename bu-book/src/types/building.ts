export interface Room {
  id: number;
  building_id: number;
  eid: number;
  title: string;
  url: string;
  grouping: string;
  capacity: number;
  gtype: number;
  gBookingSelectableTime: boolean;
  hasInfo: boolean;
  thumbnail: string;
  filterIds: number[];
  available: boolean;
}

export interface Building {
  id: number;
  Name: string;
  ShortName: string;
  Address: string;
  website: string;
  contacts: Record<string, string>;
  available: boolean;
  libcal_id: number;
  lid: number;
  Rooms?: Room[];
}
