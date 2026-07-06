/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface User {
  id: string;
  username: string;
  email: string;
  coinBalance: number;
  createdAt: string;
}

export type AuthMode = 'login' | 'register';

export interface NotificationState {
  message: string;
  type: 'success' | 'error' | 'info';
}
