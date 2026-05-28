import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../core/services/notification.service';
import { Toast, ToastType } from '../../models/error.model';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.component.html',
  styles: [`
    :host {
      position: fixed;
      bottom: 16px;
      right: 16px;
      z-index: 9999;
      display: flex;
      flex-direction: column-reverse;
      gap: 8px;
      max-width: 380px;
      width: 100%;
      pointer-events: none;
    }
    .toast-item {
      pointer-events: auto;
      animation: slideIn 0.3s ease-out;
    }
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes progressBar {
      from { width: 100%; }
      to { width: 0%; }
    }
  `],
})
export class ToastComponent {
  private notificationService = inject(NotificationService);

  toasts = this.notificationService.toasts;

  dismiss(id: number): void {
    this.notificationService.dismiss(id);
  }

  getBorderColor(type: Toast['type']): string {
    const colors: Record<ToastType, string> = {
      success: 'border-l-green-500',
      error: 'border-l-red-500',
      warning: 'border-l-yellow-500',
      info: 'border-l-blue-500',
    };
    return colors[type] || '';
  }

  getBgColor(type: Toast['type']): string {
    const colors: Record<ToastType, string> = {
      success: 'bg-green-900',
      error: 'bg-red-900',
      warning: 'bg-yellow-900',
      info: 'bg-blue-900',
    };
    return colors[type] || 'bg-gray-900';
  }

  getIcon(type: Toast['type']): string {
    const icons: Record<ToastType, string> = {
      success: 'M5 13l4 4L19 7',
      error: 'M6 18L18 6M6 6l12 12',
      warning: 'M12 9v2m0 4h.01M12 3l9.66 16.5H2.34L12 3z',
      info: 'M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z',
    };
    return icons[type] || icons['info'];
  }

  getAnimationDuration(duration: number): string {
    return `${duration}ms`;
  }
}
