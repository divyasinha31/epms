enum ProjectStatus {
  PLANNING = 'planning',
  IN_PROGRESS = 'in_progress',
  ON_HOLD = 'on_hold',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
};

interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  startDate: Date;
  endDate: Date;
  managerId: string;
  teamMembers: string[];
  createdAt: Date;
  updatedAt: Date;
};

export {
  ProjectStatus,
  Project
};
