import Home from '../pages/Home';
import NotFound from '../pages/NotFound';

export const routes = {
  canvas: {
    id: 'canvas',
    label: 'Canvas',
    path: '/canvas',
    icon: 'Palette',
    component: Home
  }
};

export const routeArray = Object.values(routes);