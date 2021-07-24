import Timetable from '@/components/pages/Timetable.vue';

const routes = [
	{
		name: 'Timetable',
		component: Timetable,
		path: '/',
		meta: { title: 'Timetable | Desktop' },
	},
	{
		name: 'EditTimetable',
		component: () => import('@/components/pages/EditTimetable.vue'),
		path: '/edit-timetable',
		meta: { title: 'Edit Timetable | Desktop' },
	},
	{
		name: 'Search',
		component: () => import('@/components/pages/Search.vue'),
		path: '/search',
		meta: { title: 'Search Courses | Desktop' },
	},
	{
		name: 'ShareTimetable',
		component: () => import('@/components/pages/ShareTimetable.vue'),
		path: '/share-timetable',
		meta: { title: 'Share Timetable | Desktop' },
	},
];

export default routes;
