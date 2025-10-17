import cameraIcon from '../../assets/camera.svg';
import verifiedCheckIcon from '../../assets/verified-check.svg';
import type { TaskType } from '../../shared/types';

export const TasksList: TaskType[] = [
  {
    id: '1',
    title: 'Take photo of coffee shop menu board',
    description:
      'Go to BeanCraft and show the full menu board clearly. Payment in escrow.',
    variant: 'urgent',
    price: 20,
    position: { lat: 37.758749, lng: -122.461771 },
    tags: [
      { type: 'badge', label: 'Urgent', color: 'green' },
      { type: 'stars', count: 20 },
      { type: 'hLeft', count: 2 },
      { type: 'km', count: 1.2 },
    ],
    icon: cameraIcon,
  },
  {
    id: '2',
    title: 'Verify store opening hours',
    description:
      'Check and capture the posted hours at "Daily Mart". Confirm if holiday hours apply.',
    variant: 'urgent',
    price: 35,
    position: { lat: 37.75254, lng: -122.472629 },
    tags: [
      { type: 'badge', label: 'Urgent', color: 'green' },
      { type: 'stars', count: 35 },
      { type: 'km', count: 1.2, label: 'km' },
    ],
    icon: verifiedCheckIcon,
  },
  {
    id: '3',
    title: 'Translate menu from photo',
    description:
      'Lorem ipsum dolor sit amet consectetur adipisicing elit. Asperiores odio vel voluptate, cupiditate eveniet est nostrum saepe libero quibusdam aut laborum autem atque rerum harum mollitia nulla nihil, labore accusantium.',
    variant: 'remote',
    price: 50,
    position: { lat: 37.749859, lng: -122.465076 },
    tags: [
      { type: 'badge', label: 'Remote', color: 'blue' },
      { type: 'stars', count: 50 },
      { type: 'km', count: 1.2, label: 'km' },
    ],
    icon: verifiedCheckIcon,
  },
];
