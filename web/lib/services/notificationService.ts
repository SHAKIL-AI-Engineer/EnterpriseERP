import api from "@/lib/api";

export interface Notification {
  id: string;
  recipientId: string;
  recipientEmail: string;
  recipientPhone: string;
  type: "Email" | "SMS" | "InApp";
  subject: string;
  body: string;
  status: "Pending" | "Sent" | "Failed" | "Read";
  sentAt: string | null;
  errorMessage: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface SendNotificationRequest {
  recipientId: string;
  recipientEmail?: string;
  recipientPhone?: string;
  type?: "Email" | "SMS" | "InApp";
  subject: string;
  body?: string;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  type: "Email" | "SMS" | "InApp";
  subject: string;
  body: string;
  isActive: boolean;
  createdAt: string;
}

export const notificationService = {
  async fetchByRecipient(recipientId: string): Promise<Notification[]> {
    const res = await api.get<Notification[]>(
      `/notification/recipient/${recipientId}`
    );
    return res.data;
  },

  async send(req: SendNotificationRequest): Promise<Notification> {
    const res = await api.post<Notification>("/notification/send", {
      ...req,
      type: req.type ?? "InApp",
    });
    return res.data;
  },

  async markRead(id: string): Promise<void> {
    await api.put(`/notification/${id}/read`);
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/notification/${id}`);
  },

  async getUnreadCount(recipientId: string): Promise<number> {
    const res = await api.get<{ count: number }>(
      `/notification/unread-count/${recipientId}`
    );
    return res.data.count;
  },

  async fetchTemplates(): Promise<NotificationTemplate[]> {
    const res = await api.get<NotificationTemplate[]>(
      "/notification/templates"
    );
    return res.data;
  },

  async createTemplate(
    t: Omit<NotificationTemplate, "id" | "createdAt">
  ): Promise<NotificationTemplate> {
    const res = await api.post<NotificationTemplate>(
      "/notification/templates",
      t
    );
    return res.data;
  },
};
