
export interface BpmnElement {
  id: string;
  type: string;
  name: string;
  properties: Record<string, string>;
}

export interface ModificationDetail {
  id: string;
  name: string;
  type: string;
  changes: {
      property: string;
      oldValue: string | null;
      newValue: string | null;
  }[];
}

export interface DiffResult {
  added: string[];
  removed: string[];
  modified: ModificationDetail[];
  addedDetails: BpmnElement[];
  removedDetails: BpmnElement[];
}
