import CanvasPage from '@/components/pages/CanvasPage';
    import NotFoundPage from '@/components/pages/NotFoundPage';

export const routes = {
  canvas: {
    id: 'canvas',
    label: 'Canvas',
    path: '/canvas',
    icon: 'Palette',
icon: 'Palette',
        component: CanvasPage
  }
};

export const routeArray = Object.values(routes);