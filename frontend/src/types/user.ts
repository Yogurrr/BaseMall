export interface AuthResponse {
  token: string;
  id: number;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
}

export interface UserInfo {
  id: number;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  favoriteTeam?: string;
  grade?: string | null;
  points: number;
}

export interface User {
  id?: number;
  name: string;
  email: string;
}

export interface UserDetail {
  id: number;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  favoriteTeam: string | null;
  grade: string | null;
  points: number;
  createdAt: string;
  useAt: 'Y' | 'N';
  withdrawnAt: string | null;
}

export interface MemberGradeCount {
  grade: string;
  count: number;
}

export interface MemberStats {
  todaySignups: number;
  monthSignups: number;
  totalMembers: number;
  totalWithdrawn: number;
  monthWithdrawn: number;
  gradeDistribution: MemberGradeCount[];
}
