
import { create } from 'zustand';

export type FacadeItem = {
  id: string;
  name: string;
  grossAreaM2: number;
  voidsAreaM2: number;
  netAreaM2: number;
  imageUri?: string;
  createdAt: string;
};

export type RoofItem = {
  id: string;
  name: string;
  areaM2: number;
  createdAt: string;
};

export type BuildingItem = {
  id: string;
  name: string;
  facades: FacadeItem[];
  roofs: RoofItem[];
  createdAt: string;
};

export type ProductPreparationSummary = {
  productLabel?: string;
  treatment?: string;
  volumeMelange?: number;
  produitPur?: number;
  eau?: number;
  rinseWater?: number;
  coutProduit?: number;
  rinseEnabled?: boolean;
  boosterVolume?: number;
  boosterCost?: number;
  boosterLabel?: string;
  boosterPercent?: number;
};

export type ProjectStatus =
  | 'draft'
  | 'measured'
  | 'quoted'
  | 'sent'
  | 'approved'
  | 'scheduled'
  | 'completed'
  | 'refused'
  | 'archived';

export type ProjectItem = {
  id: string;
  clientName: string;
  phone: string;
  address: string;
  postalCode: string;
  city: string;
  buildings: BuildingItem[];
  createdAt: string;
  updatedAt: string;
  status?: ProjectStatus;
  quoteAmount?: number;
  scheduledFor?: string;
  completedAt?: string;
  roofProductsSummary?: ProductPreparationSummary | null;
  facadeProductsSummary?: ProductPreparationSummary | null;
};

type CreateProjectInput = {
  clientName: string;
  phone: string;
  address: string;
  postalCode: string;
  city: string;
};

type ProjectStore = {
  projects: ProjectItem[];
  currentProjectId: string | null;

  createProject: (input: CreateProjectInput) => string;
  setCurrentProject: (projectId: string | null) => void;

  updateProject: (
    projectId: string,
    updates: Partial<
      Pick<
        ProjectItem,
        | 'clientName'
        | 'phone'
        | 'address'
        | 'postalCode'
        | 'city'
        | 'quoteAmount'
        | 'scheduledFor'
        | 'completedAt'
        | 'roofProductsSummary'
        | 'facadeProductsSummary'
      >
    >
  ) => void;

  deleteProject: (projectId: string) => void;

  addBuilding: (projectId: string, name?: string) => string;
  renameBuilding: (projectId: string, buildingId: string, name: string) => void;
  deleteBuilding: (projectId: string, buildingId: string) => void;

  addFacadeToBuilding: (
    projectId: string,
    buildingId: string,
    facade: Omit<FacadeItem, 'id' | 'createdAt'>
  ) => string;

  updateFacadeInBuilding: (
    projectId: string,
    buildingId: string,
    facadeId: string,
    updates: Partial<Omit<FacadeItem, 'id' | 'createdAt'>>
  ) => void;

  deleteFacadeFromBuilding: (
    projectId: string,
    buildingId: string,
    facadeId: string
  ) => void;

  addRoofToBuilding: (
    projectId: string,
    buildingId: string,
    roof: Omit<RoofItem, 'id' | 'createdAt'>
  ) => string;

  updateRoofInBuilding: (
    projectId: string,
    buildingId: string,
    roofId: string,
    updates: Partial<Omit<RoofItem, 'id' | 'createdAt'>>
  ) => void;

  deleteRoofFromBuilding: (
    projectId: string,
    buildingId: string,
    roofId: string
  ) => void;

  getProjectById: (projectId: string) => ProjectItem | undefined;
  getCurrentProject: () => ProjectItem | undefined;

  getProjectTotals: (projectId: string) => {
    buildingCount: number;
    facadeCount: number;
    roofCount: number;
    grossFacadeAreaM2: number;
    voidsAreaM2: number;
    netFacadeAreaM2: number;
    roofAreaM2: number;
  };

  setProjectStatus: (projectId: string, status: ProjectItem['status']) => void;
};

const uid = (prefix: string) =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const now = () => new Date().toISOString();

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: [],
  currentProjectId: null,

  createProject: (input) => {
    const projectId = uid('project');
    const timestamp = now();

    const project: ProjectItem = {
      id: projectId,
      clientName: input.clientName.trim(),
      phone: input.phone.trim(),
      address: input.address.trim(),
      postalCode: input.postalCode.trim(),
      city: input.city.trim(),
      buildings: [],
      createdAt: timestamp,
      updatedAt: timestamp,
      status: 'draft',
      quoteAmount: 0,
      scheduledFor: '',
      completedAt: '',
      roofProductsSummary: null,
      facadeProductsSummary: null,
    };

    set((state) => ({
      projects: [project, ...state.projects],
      currentProjectId: projectId,
    }));

    return projectId;
  },

  setCurrentProject: (projectId) => {
    set({ currentProjectId: projectId });
  },

  updateProject: (projectId, updates) => {
    set((state) => ({
      projects: state.projects.map((project) =>
        project.id === projectId
          ? {
              ...project,
              ...updates,
              updatedAt: now(),
            }
          : project
      ),
    }));
  },

  deleteProject: (projectId) => {
    set((state) => ({
      projects: state.projects.filter((project) => project.id !== projectId),
      currentProjectId:
        state.currentProjectId === projectId ? null : state.currentProjectId,
    }));
  },

  setProjectStatus: (projectId, status) => {
    set((state) => ({
      projects: state.projects.map((project) =>
        project.id === projectId
          ? {
              ...project,
              status,
              updatedAt: now(),
            }
          : project
      ),
    }));
  },

  addBuilding: (projectId, name) => {
    const buildingId = uid('building');
    const building: BuildingItem = {
      id: buildingId,
      name: name?.trim() || `Bâtiment ${Math.floor(Math.random() * 900 + 100)}`,
      facades: [],
      roofs: [],
      createdAt: now(),
    };

    set((state) => ({
      projects: state.projects.map((project) =>
        project.id === projectId
          ? {
              ...project,
              buildings: [...project.buildings, building],
              updatedAt: now(),
            }
          : project
      ),
    }));

    return buildingId;
  },

  renameBuilding: (projectId, buildingId, name) => {
    set((state) => ({
      projects: state.projects.map((project) =>
        project.id === projectId
          ? {
              ...project,
              buildings: project.buildings.map((building) =>
                building.id === buildingId
                  ? { ...building, name: name.trim() || building.name }
                  : building
              ),
              updatedAt: now(),
            }
          : project
      ),
    }));
  },

  deleteBuilding: (projectId, buildingId) => {
    set((state) => ({
      projects: state.projects.map((project) =>
        project.id === projectId
          ? {
              ...project,
              buildings: project.buildings.filter(
                (building) => building.id !== buildingId
              ),
              updatedAt: now(),
            }
          : project
      ),
    }));
  },

  addFacadeToBuilding: (projectId, buildingId, facade) => {
    const facadeId = uid('facade');
    const newFacade: FacadeItem = {
      id: facadeId,
      createdAt: now(),
      ...facade,
    };

    set((state) => ({
      projects: state.projects.map((project) =>
        project.id === projectId
          ? {
              ...project,
              buildings: project.buildings.map((building) =>
                building.id === buildingId
                  ? { ...building, facades: [...building.facades, newFacade] }
                  : building
              ),
              updatedAt: now(),
            }
          : project
      ),
    }));

    return facadeId;
  },

  updateFacadeInBuilding: (projectId, buildingId, facadeId, updates) => {
    set((state) => ({
      projects: state.projects.map((project) =>
        project.id === projectId
          ? {
              ...project,
              buildings: project.buildings.map((building) =>
                building.id === buildingId
                  ? {
                      ...building,
                      facades: building.facades.map((facade) =>
                        facade.id === facadeId
                          ? { ...facade, ...updates }
                          : facade
                      ),
                    }
                  : building
              ),
              updatedAt: now(),
            }
          : project
      ),
    }));
  },

  deleteFacadeFromBuilding: (projectId, buildingId, facadeId) => {
    set((state) => ({
      projects: state.projects.map((project) =>
        project.id === projectId
          ? {
              ...project,
              buildings: project.buildings.map((building) =>
                building.id === buildingId
                  ? {
                      ...building,
                      facades: building.facades.filter(
                        (facade) => facade.id !== facadeId
                      ),
                    }
                  : building
              ),
              updatedAt: now(),
            }
          : project
      ),
    }));
  },

  addRoofToBuilding: (projectId, buildingId, roof) => {
    const roofId = uid('roof');
    const newRoof: RoofItem = {
      id: roofId,
      createdAt: now(),
      ...roof,
    };

    set((state) => ({
      projects: state.projects.map((project) =>
        project.id === projectId
          ? {
              ...project,
              buildings: project.buildings.map((building) =>
                building.id === buildingId
                  ? { ...building, roofs: [...building.roofs, newRoof] }
                  : building
              ),
              updatedAt: now(),
            }
          : project
      ),
    }));

    return roofId;
  },

  updateRoofInBuilding: (projectId, buildingId, roofId, updates) => {
    set((state) => ({
      projects: state.projects.map((project) =>
        project.id === projectId
          ? {
              ...project,
              buildings: project.buildings.map((building) =>
                building.id === buildingId
                  ? {
                      ...building,
                      roofs: building.roofs.map((roof) =>
                        roof.id === roofId ? { ...roof, ...updates } : roof
                      ),
                    }
                  : building
              ),
              updatedAt: now(),
            }
          : project
      ),
    }));
  },

  deleteRoofFromBuilding: (projectId, buildingId, roofId) => {
    set((state) => ({
      projects: state.projects.map((project) =>
        project.id === projectId
          ? {
              ...project,
              buildings: project.buildings.map((building) =>
                building.id === buildingId
                  ? {
                      ...building,
                      roofs: building.roofs.filter((roof) => roof.id !== roofId),
                    }
                  : building
              ),
              updatedAt: now(),
            }
          : project
      ),
    }));
  },

  getProjectById: (projectId) => {
    return get().projects.find((project) => project.id === projectId);
  },

  getCurrentProject: () => {
    const { currentProjectId, projects } = get();
    return projects.find((project) => project.id === currentProjectId);
  },

  getProjectTotals: (projectId) => {
    const project = get().projects.find((item) => item.id === projectId);

    if (!project) {
      return {
        buildingCount: 0,
        facadeCount: 0,
        roofCount: 0,
        grossFacadeAreaM2: 0,
        voidsAreaM2: 0,
        netFacadeAreaM2: 0,
        roofAreaM2: 0,
      };
    }

    const facadeList = project.buildings.flatMap((building) => building.facades);
    const roofList = project.buildings.flatMap((building) => building.roofs);

    return {
      buildingCount: project.buildings.length,
      facadeCount: facadeList.length,
      roofCount: roofList.length,
      grossFacadeAreaM2: facadeList.reduce(
        (sum, facade) => sum + facade.grossAreaM2,
        0
      ),
      voidsAreaM2: facadeList.reduce((sum, facade) => sum + facade.voidsAreaM2, 0),
      netFacadeAreaM2: facadeList.reduce((sum, facade) => sum + facade.netAreaM2, 0),
      roofAreaM2: roofList.reduce((sum, roof) => sum + roof.areaM2, 0),
    };
  },
}));
