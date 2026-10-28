import { TeamRole } from './team';

export interface CurrentUser {
  id: string;
  name: string;
  phone: string;
  role: TeamRole;
  tenantId: string;
  tenantName: string;
  avatarUrl?: string;
}

export const DEMO_USERS: CurrentUser[] = [
  {
    id: 'usr_01',
    name: 'Sajedur Rahman',
    phone: '+880 1711-000001',
    role: 'super_admin',
    tenantId: 'ten_loom_01',
    tenantName: 'Bengal Loom & Crafts',
  },
  {
    id: 'usr_02',
    name: 'Rafiq Islam',
    phone: '+880 1712-984210',
    role: 'admin',
    tenantId: 'ten_loom_01',
    tenantName: 'Bengal Loom & Crafts',
  },
  {
    id: 'usr_03',
    name: 'Anika Tabassum',
    phone: '+880 1713-445566',
    role: 'agent',
    tenantId: 'ten_loom_01',
    tenantName: 'Bengal Loom & Crafts',
  },
  {
    id: 'usr_07',
    name: 'Mushfiqur Rahman',
    phone: '+880 1819-204918',
    role: 'admin',
    tenantId: 'ten_gadget_02',
    tenantName: 'Gadget Express BD',
  },
  {
    id: 'usr_08',
    name: 'Tanvir Ahmed',
    phone: '+880 1820-334455',
    role: 'agent',
    tenantId: 'ten_gadget_02',
    tenantName: 'Gadget Express BD',
  },
  {
    id: 'usr_10',
    name: 'Dr. Kazi Mahfuz',
    phone: '+880 1711-002941',
    role: 'admin',
    tenantId: 'ten_med_04',
    tenantName: 'Dhaka Pharma & Care',
  },
];
