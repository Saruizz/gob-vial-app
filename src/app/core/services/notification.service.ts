import { Injectable, signal } from '@angular/core';
import { Toast, ToastType } from '../../shared/models/error.model';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private nextId = 0;
  private readonly maxToasts = 5;

  toasts = signal<Toast[]>([]);

  success(message: string, title: string = 'Exito'): void {
    this.addToast('success', title, message, 4000);
  }

  error(message: string, title: string = 'Error'): void {
    this.addToast('error', title, message, 6000);
  }

  warning(message: string, title: string = 'Atencion'): void {
    this.addToast('warning', title, message, 5000);
  }

  info(message: string, title: string = 'Informacion'): void {
    this.addToast('info', title, message, 3000);
  }

  dismiss(id: number): void {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }

  private addToast(type: ToastType, title: string, message: string, duration: number): void {
    const toast: Toast = {
      id: this.nextId++,
      type,
      title,
      message,
      duration,
    };

    this.toasts.update((list) => {
      const updated = [toast, ...list];
      if (updated.length > this.maxToasts) {
        updated.length = this.maxToasts;
      }
      return updated;
    });

    setTimeout(() => {
      this.dismiss(toast.id);
    }, duration);
  }
}
