enum UserRole {
  ADMIN = 'admin',
  PROJECT_MANAGER = 'project_manager',
  DEVELOPER = 'developer'
};

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

interface LoginRequest {
  email: string;
  password: string;
};

interface LoginResponse {
  user: User;
  token: string;
  refreshToken: string;
};

export {
    UserRole,
    User,
    LoginRequest,
    LoginResponse
};
