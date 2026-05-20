import type { ReplicaEnvironment } from '../types.ts';

export interface ReplicaConsoleEndpoints {
  snapshot: string;
  stream: string;
  clear: string;
}

export interface ReplicaSettingsEnvironment {
  key: ReplicaEnvironment;
  label: string;
  host: string;
}

export type ReplicaSettingsRowIcon = 'profile' | 'feedback' | 'shield';

export interface ReplicaSettingsRow {
  key: string;
  label: string;
  icon?: ReplicaSettingsRowIcon;
}

export interface ReplicaSmsCodeResult {
  smsId?: string;
  smsCode?: string;
}

export interface ReplicaLoginPayload {
  phoneNumber: string;
  smsCode: string;
  smsId: string;
}
