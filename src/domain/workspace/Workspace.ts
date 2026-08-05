import { Branch } from '../branch/Branch';

export interface Workspace {
  id: string;
  name: string;
  branches: Branch[];
  activeBranchId: string;
}
