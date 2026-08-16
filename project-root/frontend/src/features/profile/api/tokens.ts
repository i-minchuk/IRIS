import client from "@/shared/api/client";

export interface ApiTokenItem {
  id: string;
  name: string;
  createdAt: string;
  last4: string;
}

export interface CreateTokenResponse {
  token: string;
  id: string;
  name: string;
  created_at: string;
}

export const tokensApi = {
  list: () => client.get<ApiTokenItem[]>("/users/me/tokens"),

  create: (name: string) =>
    client.post<CreateTokenResponse>("/users/me/tokens", { name }),

  revoke: (id: string) => client.delete(`/users/me/tokens/${id}`),
};
