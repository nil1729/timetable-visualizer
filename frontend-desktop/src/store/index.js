import Vue from 'vue';
import Vuex from 'vuex';
import createConfig from './helpers/api-auth';
import localDB from './api/localDB';
import moment from 'moment';

Vue.use(Vuex);

export default new Vuex.Store({
	state: {
		notifications: [],
	},

	getters: {
		notifications(state) {
			return state.notifications;
		},
	},

	mutations: {
		ADD_NOTIFICATION(state, notification) {
			state.notifications = [...state.notifications, notification];
		},
	},

	actions: {
		async sendRequest(context, { url, method, requestBody }) {
			try {
				let res = await fetch(`/api/v1/${url}`, {
					method: method,
					headers: createConfig(),
					body: requestBody && JSON.stringify(requestBody),
				});
				return await res.json();
			} catch (e) {
				console.log(e);
			}
		},

		async addCourseToUserStore(context, course) {
			try {
				let { clashFound, clashedCourse } = await context.dispatch(
					'checkCompreExamClashes',
					course
				);

				if (clashFound) {
					context.commit('ADD_NOTIFICATION', {
						message: `COMPRE TIME CLASHES WITH ${clashedCourse.courseName} (${clashedCourse.courseCode})`,
						type: 'warning',
					});
					return false;
				}

				await localDB.writeData('USER_COURSES', course);
				context.commit('ADD_NOTIFICATION', {
					message: `${course.courseName} (${course.courseCode}) ADDED SUCCESSFULLY`,
					type: 'success',
				});
				return true;
			} catch (e) {
				console.log(e);
			}
		},

		async checkCompreExamClashes(context, newCourse) {
			try {
				const userCourses = await localDB.readData('USER_COURSES');
				let clashedCourse;

				let clashFound = userCourses.some((course) => {
					let currentCourseCompre = moment(course.comprehensiveExamDate).format('M:D:Y[-]hh:mm');
					let newCourseCompre = moment(newCourse.comprehensiveExamDate).format('M:D:Y[-]hh:mm');
					if (newCourseCompre === 'Invalid date') return false;

					if (currentCourseCompre === newCourseCompre) clashedCourse = course;
					return currentCourseCompre === newCourseCompre;
				});

				return { clashFound, clashedCourse };
			} catch (e) {
				console.log(e);
			}
		},

		async filterSearchResults(context, results) {
			try {
				const userCourses = await localDB.readData('USER_COURSES');
				const userCoursesIDs = userCourses.map((course) => course._id);
				return results.map((course) => {
					if (userCoursesIDs.includes(course._id)) return { ...course, added: true };
					else return course;
				});
			} catch (e) {
				console.log(e);
			}
		},
	},
	modules: {},
});
