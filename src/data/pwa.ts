type ServiceWorkerReadinessInput = {
  isProduction: boolean
  hasServiceWorker: boolean
}

type ServiceWorkerReadiness = {
  canRegister: boolean
  statusText: string
}

export function getServiceWorkerReadiness({
  isProduction,
  hasServiceWorker,
}: ServiceWorkerReadinessInput): ServiceWorkerReadiness {
  if (!hasServiceWorker) {
    return {
      canRegister: false,
      statusText: 'Offline shell is unavailable in this browser.',
    }
  }

  if (!isProduction) {
    return {
      canRegister: false,
      statusText: 'Offline shell runs in production builds.',
    }
  }

  return {
    canRegister: true,
    statusText: 'Offline shell ready.',
  }
}
