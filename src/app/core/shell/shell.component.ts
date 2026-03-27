import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ButtonModule, ToastModule],
  template: `
    <div class="min-h-screen bg-[var(--app-bg)] text-[var(--app-fg)]">
      <p-toast position="top-right" appendTo="body" [baseZIndex]="10000"></p-toast>
      <main class="mx-auto w-full max-w-md px-4 pb-24 pt-4 md:max-w-3xl lg:max-w-4xl">
        <router-outlet />
      </main>

      <nav class="fixed bottom-0 left-0 right-0 border-t border-[var(--app-border)] bg-[var(--app-surface)]">
        <div class="mx-auto flex w-full max-w-md items-center justify-between px-2 py-2 md:max-w-3xl lg:max-w-4xl">
          <a
            class="flex flex-1 flex-col items-center gap-1 rounded-lg px-2 py-2 text-xs text-[var(--app-fg-muted)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400/90"
            routerLink="/home"
            routerLinkActive="bg-[var(--app-surface-2)] text-[var(--app-fg)]"
          >
            <span class="pi pi-home text-lg"></span>
            <span>Home</span>
          </a>
          <a
            class="flex flex-1 flex-col items-center gap-1 rounded-lg px-2 py-2 text-xs text-[var(--app-fg-muted)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400/90"
            routerLink="/rutina"
            routerLinkActive="bg-[var(--app-surface-2)] text-[var(--app-fg)]"
          >
            <span class="pi pi-sliders-h text-lg"></span>
            <span>Rutina</span>
          </a>
          <a
            class="flex flex-1 flex-col items-center gap-1 rounded-lg px-2 py-2 text-xs text-[var(--app-fg-muted)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400/90"
            routerLink="/entrenamiento"
            routerLinkActive="bg-[var(--app-surface-2)] text-[var(--app-fg)]"
          >
            <span class="pi pi-bolt text-lg"></span>
            <span>Entreno</span>
          </a>
          <a
            class="flex flex-1 flex-col items-center gap-1 rounded-lg px-1 py-2 text-[0.65rem] leading-tight text-[var(--app-fg-muted)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400/90 sm:text-xs"
            routerLink="/calendario"
            routerLinkActive="bg-[var(--app-surface-2)] text-[var(--app-fg)]"
            title="Calendario"
          >
            <span class="pi pi-calendar text-lg"></span>
            <span class="max-w-[4.2rem] text-center">Calendario</span>
          </a>
          <a
            class="flex flex-1 flex-col items-center gap-1 rounded-lg px-2 py-2 text-xs text-[var(--app-fg-muted)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400/90"
            routerLink="/metricas"
            routerLinkActive="bg-[var(--app-surface-2)] text-[var(--app-fg)]"
          >
            <span class="pi pi-chart-line text-lg"></span>
            <span>Métricas</span>
          </a>
        </div>
      </nav>
    </div>
  `
})
export class ShellComponent {}
