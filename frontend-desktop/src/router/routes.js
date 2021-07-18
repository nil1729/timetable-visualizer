import Timetable from '@/components/pages/Timetable.vue';

const routes = [
	{
		name: 'Timetable',
		component: Timetable,
		path: '/',
	},
	{
		name: 'EditTimetable',
		component: () => import('@/components/pages/EditTimetable.vue'),
		path: '/edit-timetable',
	},
	{
		name: 'Search',
		component: () => import('@/components/pages/Search.vue'),
		path: '/search',
	},
];

export default routes;
