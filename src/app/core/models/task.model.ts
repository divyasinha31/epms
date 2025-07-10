enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  DONE = 'done'
};

enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
};

interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  projectId: string;
  assigneeId: string;
  dueDate: Date;
  estimatedHours: number;
  actualHours: number;
  order: number;
  createdAt: Date;
  updatedAt: Date;
};

export {
  TaskStatus,
  TaskPriority,
  Task
};
